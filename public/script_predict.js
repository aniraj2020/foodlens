document.addEventListener("DOMContentLoaded", function () {
  const categorySelect = document.getElementById("categorySelect");
  const groupSelect = document.getElementById("groupSelect");
  const ctx = document.getElementById("predictChart").getContext("2d");

  let chart;
  let isInitialLoad = true;

  M.FormSelect.init(document.querySelectorAll("select"));

  applySavedFilters();

  categorySelect.addEventListener("change", async () => {
    groupSelect.innerHTML = '<option value="" disabled selected>Select Group</option>';
    const inst = M.FormSelect.getInstance(groupSelect);
    if (inst) inst.destroy();
    M.FormSelect.init(groupSelect);

    if (chart) {
      chart.destroy();
      chart = null;
    }

    await loadGroups(categorySelect.value);
  });

  groupSelect.addEventListener("change", renderChart);

  // Place reset listener AFTER categorySelect, groupSelect, and chart are defined
  document.getElementById("resetButton").addEventListener("click", () => {
    categorySelect.value = "";
    groupSelect.innerHTML = '<option value="" disabled selected>Select Group</option>';

    M.FormSelect.init(categorySelect);
    const inst = M.FormSelect.getInstance(groupSelect);
    if (inst) inst.destroy();
    M.FormSelect.init(groupSelect);

    if (chart) {
      chart.destroy();
      chart = null;
    }

    window.scrollTo(0, 0);
  });

  async function applySavedFilters() {
    try {
      const res = await fetch("/api/user/filters?chart=predict");
      const { filters } = await res.json();

      if (!filters?.category || !filters?.group) return;

      categorySelect.value = filters.category;
      M.FormSelect.init(categorySelect);

      await loadGroups(filters.category, filters.group);

      isInitialLoad = false;
    } catch (err) {
      console.error("Error applying saved filters:", err);
    }
  }

  async function loadGroups(category, preselect = null) {
    try {
      const res = await fetch(`/api/trends/values?category=${category}`);
      const { values } = await res.json();

      groupSelect.innerHTML = '<option value="" disabled selected>Select Group</option>';
      values.forEach(val => {
        const option = document.createElement("option");
        option.value = val;
        option.textContent = val;

        if (isInitialLoad && preselect === val) {
          option.selected = true;
        }

        groupSelect.appendChild(option);
      });

      const inst = M.FormSelect.getInstance(groupSelect);
      if (inst) inst.destroy();
      M.FormSelect.init(groupSelect);

      if (isInitialLoad && preselect) {
        renderChart();
      }
    } catch (err) {
      console.error("Failed to load group values:", err);
    }
  }

function validateSelections() {
  console.log("validateSelections called");

  const category = categorySelect.value;
  const group = groupSelect.value;

  // If default selected OR no value
  const categoryInvalid = !category || categorySelect.selectedIndex === 0;
  const groupInvalid = !group || groupSelect.selectedIndex === 0;

  if (categoryInvalid || groupInvalid) {
    M.toast({
      html: "Please select both a category and a group.",
      classes: "rounded red lighten-1 white-text"
    });
    return false;
  }

  return true;
}

  async function renderChart() {
    if (!validateSelections()) return;

    const category = categorySelect.value;
    const group = groupSelect.value;

    document.body.style.cursor = "wait";

    try {
      await fetch("/api/user/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chart: "predict",
          filters: { category, group }
        })
      });
    } catch (err) {
      console.error("Failed to save filters:", err);
    }

    try {
      const res = await fetch(`/api/predict?category=${category}&group=${group}`);
      const { years, actual, predicted, splitIndex } = await res.json();

      if (chart) chart.destroy();

      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: years,
          datasets: [
            {
              label: "Actual",
              data: actual,
              borderColor: "#42a5f5",
              borderWidth: 2,
              pointRadius: 4,
              fill: false,
              tension: 0.3
            },
            {
              label: "Predicted",
              data: Array(splitIndex).fill(null).concat(predicted),
              borderColor: "#ff8a65",
              borderDash: [5, 5],
              borderWidth: 2,
              pointRadius: 4,
              fill: false,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                boxWidth: 18,
                padding: 15,
                font: { size: 13 }
              }
            },
            tooltip: {
              mode: "index",
              intersect: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    } catch (err) {
      console.error("Prediction chart error:", err);
      M.toast({
        html: "Failed to load chart.",
        classes: "rounded red lighten-1 white-text"
      });
    } finally {
      document.body.style.cursor = "default";
    }
  }
});
