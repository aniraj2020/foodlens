document.addEventListener("DOMContentLoaded", function () {
  const categorySelect = document.getElementById("categorySelect");
  const checkboxContainer = document.getElementById("checkboxes");
  const chartInstruction = document.getElementById("chartInstruction");
  const ctx = document.getElementById("trendChart").getContext("2d");

  let chart;
  let savedCategory = null;
  let savedValues = [];

  M.FormSelect.init(categorySelect);

  initPage();

  async function initPage() {
    try {
      const res = await fetch("/api/user/filters?chart=combined");
      const { filters } = await res.json();

      if (filters?.category && Array.isArray(filters.values)) {
        savedCategory = filters.category;
        savedValues = filters.values;

        categorySelect.value = savedCategory;
        M.FormSelect.init(categorySelect);
        await loadCheckboxes(savedCategory, savedValues);
        renderChart(); // render after setting everything
      }
    } catch (err) {
      console.error("Error loading saved filters:", err);
    }
  }

  async function loadCheckboxes(category, preselect = []) {
    checkboxContainer.innerHTML = "";
    chartInstruction.textContent = "";

    const res = await fetch(`/api/trends/values?category=${category}`);
    const { values } = await res.json();

    if (!values.length) {
      checkboxContainer.innerHTML = "<p>No data available for this category.</p>";
      return;
    }

    // "Select All" checkbox
    const selectAllLabel = document.createElement("label");
    selectAllLabel.innerHTML = `
      <input type="checkbox" id="selectAll" />
      <span><strong>Select All</strong></span>
    `;
    checkboxContainer.appendChild(selectAllLabel);

    values.forEach((val) => {
      const safeVal = val.replace(/"/g, '&quot;');
      const isChecked = preselect.includes(val);
      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" class="filled-in group-checkbox" value="${safeVal}" ${isChecked ? "checked" : ""} />
        <span>${safeVal}</span>
      `;
      checkboxContainer.appendChild(label);
    });

    document.getElementById("selectAll").addEventListener("change", (e) => {
      const allBoxes = checkboxContainer.querySelectorAll(".group-checkbox");
      allBoxes.forEach((box) => (box.checked = e.target.checked));
      renderChart();
    });

    checkboxContainer.addEventListener("change", renderChart);
    chartInstruction.textContent = "Please select at least one checkbox to view the chart.";
  }

  async function renderChart() {
    const category = categorySelect.value;
    const selected = Array.from(
      checkboxContainer.querySelectorAll(".group-checkbox:checked")
    ).map((input) => input.value);

    const allBoxes = checkboxContainer.querySelectorAll(".group-checkbox");
    const selectAll = document.getElementById("selectAll");
    if (selectAll) {
      selectAll.checked = selected.length === allBoxes.length;
    }

    if (chart) {
      chart.destroy();
      chart = null;
    }

    if (!selected.length) {
      chartInstruction.textContent = "Please select at least one group.";
      return;
    }

    try {
      chartInstruction.textContent = "";

      const res = await fetch(`/api/trends?category=${category}&values=${encodeURIComponent(JSON.stringify(selected))}`);
      const data = await res.json();

      if (!data || !Array.isArray(data.years) || !Array.isArray(data.datasets) || !data.datasets.length) {
        chartInstruction.innerHTML = `<span style="color: red;">No chart data available for the selected group.</span>`;
        return;
      }

      // Save filters + activity only when rendering valid chart
      await fetch("/api/user/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chart: "combined",
          filters: { category, values: selected }
        })
      });

      chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: data.years,
          datasets: data.datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                boxWidth: 20,
                padding: 10,
                font: { size: 12 },
                usePointStyle: true
              }
            }
          },
          layout: { padding: { top: 10, bottom: 30 } }
        }
      });
      chartInstruction.textContent = "";
    } catch (err) {
      console.error("Chart fetch/render error:", err);
      chartInstruction.innerHTML = `<span style="color: red;">Error loading chart data.</span>`;
    }
  }

  document.getElementById("resetButton").addEventListener("click", () => {
    categorySelect.value = "";
    M.FormSelect.init(categorySelect);
    checkboxContainer.innerHTML = "";
    chartInstruction.textContent = "";
    if (chart) {
      chart.destroy();
      chart = null;
    }
    window.scrollTo(0, 0);
  });

  categorySelect.addEventListener("change", async () => {
    const selectedCat = categorySelect.value;
    checkboxContainer.innerHTML = "";
    if (chart) {
      chart.destroy();
      chart = null;
    }
    await loadCheckboxes(selectedCat); // no preselect
  });
});
