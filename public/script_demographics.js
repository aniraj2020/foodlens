document.addEventListener("DOMContentLoaded", function () {
  const yearSelect = document.getElementById("yearSelect");
  const ctx = document.getElementById("barChart").getContext("2d");

  let chart;
  let isInitialLoad = true;

  M.FormSelect.init(yearSelect);

  applySavedFilters();

  yearSelect.addEventListener("change", fetchDataAndRender);

  async function applySavedFilters() {
    try {
      const res = await fetch("/api/user/filters?chart=demographics");
      const { filters } = await res.json();

      if (!filters?.category) return;

      yearSelect.value = filters.category;
      M.FormSelect.init(yearSelect);
      isInitialLoad = false;

      fetchDataAndRender(); // auto-render chart for saved filter
    } catch (err) {
      console.error("Error applying saved filters:", err);
    }
  }

  function validateSelection() {
    const category = yearSelect.value;
    if (!category) {
      M.toast({
        html: "Please select a year.",
        classes: "rounded red lighten-1 white-text"
      });
      return false;
    }
    return true;
  }

  document.getElementById("resetButton").addEventListener("click", async () => {
  // Reset dropdown to default (assumes "All" is default)
  yearSelect.value = "All";
  M.FormSelect.init(yearSelect);

  // Destroy chart if visible
  if (chart) {
    chart.destroy();
    chart = null;
  }

  // Clear saved filters from backend
  try {
    await fetch("/api/user/filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chart: "demographics",
        filters: {category: year}
      })
    });
  } catch (err) {
    console.error("Failed to reset filters:", err);
  }

  // Scroll to top
  window.scrollTo(0, 0);

  // Re-render chart for "All Years"
  fetchDataAndRender();
});

  async function fetchDataAndRender() {
    if (!validateSelection()) return;

    const year = yearSelect.value;

    // Save selected filter
    try {
      await fetch("/api/user/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chart: "demographics",
          filters: { category: year }
        })
      });
    } catch (err) {
      console.error("Failed to save filters:", err);
    }

    // Fetch data & render chart
    try {
      const res = await fetch(`/api/demographics?year=${year}`);
      const data = await res.json();

      if (chart) chart.destroy();

      chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: data.labels,
          datasets: [{
            label: "Sample Size",
            data: data.values,
            backgroundColor: "rgba(63, 81, 181, 0.6)"
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 }
            }
          }
        }
      });
    } catch (err) {
      console.error("Chart rendering failed:", err);
      M.toast({
        html: "Failed to load chart.",
        classes: "rounded red lighten-1 white-text"
      });
    }
  }
});
