document.addEventListener("DOMContentLoaded", function () {
    M.FormSelect.init(document.querySelectorAll("select"));
    const categorySelect = document.getElementById("categorySelect");
    const groupSelect = document.getElementById("groupSelect");
    const ctx = document.getElementById("predictChart").getContext("2d");
  
    let chart;
  
    // Load group values when category changes
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
    });
  
    // Load chart when group is selected
    groupSelect.addEventListener("change", renderChart);
    categorySelect.addEventListener("change", renderChart);
  
    async function renderChart() {
      const category = categorySelect.value;
      const group = groupSelect.value;
  
      if (!category || !group) return;
  
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
                  font: {
                    size: 13
                  }
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
      }
    }
  });
  