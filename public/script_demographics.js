document.addEventListener("DOMContentLoaded", function () {
  const socket = io();
  const yearSelect = document.getElementById("yearSelect");
  const ctx = document.getElementById("barChart").getContext("2d");
  let chart;
  let isInitialLoad = true;

  M.FormSelect.init(yearSelect);

  applySavedFilters();
  yearSelect.addEventListener("change", fetchDataAndRender);

  document.getElementById("resetButton").addEventListener("click", async () => {
    const resetYear = "All";
    yearSelect.value = resetYear;
    M.FormSelect.init(yearSelect);

    if (chart) {
      chart.destroy();
      chart = null;
    }

    try {
      await fetch("/api/user/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chart: "demographics",
          filters: { category: resetYear }
        })
      });
    } catch (err) {
      console.error("Failed to reset filters:", err);
    }

    window.scrollTo(0, 0);
    fetchDataAndRender();
  });

  async function applySavedFilters() {
    try {
      const res = await fetch("/api/user/filters?chart=demographics");
      const { filters } = await res.json();

      if (!filters?.category) return;

      yearSelect.value = filters.category;
      M.FormSelect.init(yearSelect);
      isInitialLoad = false;
      fetchDataAndRender();
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

  async function fetchDataAndRender() {
    if (!validateSelection()) return;
    const year = yearSelect.value;

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
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                boxWidth: 20,
                padding: 10,
                font: { size: 13 },
                usePointStyle: true
              }
            }
          }
        }
      });
      if (window.location.pathname !== "/admin-panel") {
        socket.emit("pageVisited", { page: window.location.pathname });
      }

    } catch (err) {
      console.error("Chart rendering failed:", err);
      M.toast({
        html: "Failed to load chart.",
        classes: "rounded red lighten-1 white-text"
      });
    }
  }

  // Emit page visit to analytics (Socket.IO, skip admin panel)
  if (window.location.pathname !== "/admin-panel") {
    socket.emit("pageVisited", { page: window.location.pathname });
  }

});
