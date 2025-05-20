document.addEventListener("DOMContentLoaded", function () {
  M.FormSelect.init(document.querySelectorAll("select"));

  const categorySelect = document.getElementById("categorySelect");
  const groupSelect = document.getElementById("groupSelect");
  const ctx = document.getElementById("insightChart").getContext("2d");

  let chart;
  let isInitialLoad = true;

  // Initial load
  applySavedFilters();

  // Reset button
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

  // Handle category change
  categorySelect.addEventListener("change", async () => {
    const category = categorySelect.value;
    groupSelect.innerHTML = '<option value="" disabled selected>Select Group</option>';

    const res = await fetch(`/api/trends/values?category=${category}`);
    const { values } = await res.json();

    values.forEach(val => {
      const option = document.createElement("option");
      option.value = val;
      option.textContent = val;
      groupSelect.appendChild(option);
    });

    const inst = M.FormSelect.getInstance(groupSelect);
    if (inst) inst.destroy();
    M.FormSelect.init(groupSelect);

    clearChart();
    if (!isInitialLoad) renderChartIfReady();
  });

  // Render on group change
  groupSelect.addEventListener("change", renderChartIfReady);

  function clearChart() {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  }

  async function applySavedFilters() {
    try {
      const res = await fetch("/api/user/filters?chart=insight");
      const { filters } = await res.json();

      if (!filters?.category || !filters?.group) return;

      categorySelect.value = filters.category;
      M.FormSelect.init(categorySelect);

      const res2 = await fetch(`/api/trends/values?category=${filters.category}`);
      const { values } = await res2.json();

      groupSelect.innerHTML = '<option value="" disabled>Select Group</option>';
      values.forEach(val => {
        const option = document.createElement("option");
        option.value = val;
        option.textContent = val;
        if (val === filters.group) option.selected = true;
        groupSelect.appendChild(option);
      });

      M.FormSelect.init(groupSelect);
      isInitialLoad = false;

      renderChartIfReady();
    } catch (err) {
      console.error("Error applying saved Insight filters:", err);
    }
  }

  async function renderChartIfReady() {
    const category = categorySelect.value;
    const group = groupSelect.value;

    if (!category || !group) {
      clearChart();
      M.toast({
        html: "Please select both a category and a group.",
        classes: "rounded red lighten-1 white-text",
        displayLength: 2000
      });
      return;
    }

    try {
      const res = await fetch(`/api/insight?category=${category}&group=${group}`);
      const data = await res.json();

      if (!data?.years || !data?.datasets?.length) {
        throw new Error("Malformed chart data");
      }

      await fetch("/api/user/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chart: "insight",
          filters: { category, group }
        })
      });

      clearChart();

      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.years,
          datasets: data.datasets.map((d) => ({
            ...d,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            borderWidth: 2
          }))
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                boxWidth: 20,
                padding: 12,
                font: { size: 13 }
              }
            },
            tooltip: {
              mode: "index",
              intersect: false
            }
          },
          interaction: {
            mode: "nearest",
            intersect: false
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 200 }
            }
          }
        }
      });
    } catch (err) {
      console.error("Chart render error:", err);
      M.toast({
        html: "Error loading chart.",
        classes: "rounded red lighten-1 white-text",
        displayLength: 2000
      });
    }
  }
});
