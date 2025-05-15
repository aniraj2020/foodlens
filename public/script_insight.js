// Final improved script_insight.js

document.addEventListener("DOMContentLoaded", function () {
    M.FormSelect.init(document.querySelectorAll("select"));
    const categorySelect = document.getElementById("categorySelect");
    const groupSelect = document.getElementById("groupSelect");
    const ctx = document.getElementById("insightChart").getContext("2d");
  
    let chart;
  
    // Fetch group options when category changes
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
  
      M.FormSelect.init(groupSelect);
      clearChart();
    });
  
    groupSelect.addEventListener("change", () => {
      renderChartIfReady();
    });
  
    categorySelect.addEventListener("change", () => {
      renderChartIfReady();
    });
  
    function clearChart() {
      if (chart) {
        chart.destroy();
        chart = null;
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
  
        if (!data || !data.years || !data.datasets || data.datasets.length === 0) {
          throw new Error("Malformed chart data");
        }
  
        clearChart();
  
        chart = new Chart(ctx, {
          type: "line",
          data: {
            labels: data.years,
            datasets: data.datasets.map((d, i) => ({
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
  