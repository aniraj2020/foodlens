document.addEventListener("DOMContentLoaded", function () {
    const yearSelect = document.getElementById("yearSelect");
    M.FormSelect.init(yearSelect);
  
    const ctx = document.getElementById("barChart").getContext("2d");
    let chart;
  
    async function fetchDataAndRender() {
      const year = yearSelect.value;
  
      const res = await fetch(`/api/demographics?year=${year}`);
      const data = await res.json();
  
      console.log("Data fetched:", data);
  
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
    }
  
    yearSelect.addEventListener("change", fetchDataAndRender);
    fetchDataAndRender(); // initial load
  });
  