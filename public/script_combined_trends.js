document.addEventListener("DOMContentLoaded", function () {
    const categorySelect = document.getElementById("categorySelect");
    const checkboxContainer = document.getElementById("checkboxes");
    const chartInstruction = document.getElementById("chartInstruction");
    const ctx = document.getElementById("trendChart").getContext("2d");
  
    let chart;
    M.FormSelect.init(categorySelect);
  
    // Chart rendering logic centralized
    const renderChart = async () => {
      const category = categorySelect.value;
      const selected = Array.from(
        checkboxContainer.querySelectorAll(".group-checkbox:checked")
      ).map((input) => input.value);
  
      const allGroupBoxes = checkboxContainer.querySelectorAll(".group-checkbox");
      const selectAll = document.getElementById("selectAll");
      if (selectAll) {
        selectAll.checked = selected.length === allGroupBoxes.length;
      }
  
      if (chart) {
        chart.destroy();
        chart = null;
      }
  
      if (selected.length === 0) {
        chartInstruction.textContent = "Please select at least one group.";
        return;
      }
  
      try {
        chartInstruction.textContent = "";
  
        const trendRes = await fetch(
          `/api/trends?category=${category}&values=${encodeURIComponent(JSON.stringify(selected))}`
        );
  
        if (!trendRes.ok) throw new Error("Network response was not OK");
  
        const data = await trendRes.json();
  
        if (
          !data ||
          !Array.isArray(data.years) ||
          !Array.isArray(data.datasets) ||
          data.datasets.length === 0
        ) {
          chartInstruction.innerHTML = `<span style="color: red;">No chart data available for the selected group.</span>`;
          return;
        }
  
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
                  font: {
                    size: 12
                  },
                  usePointStyle: true,
                  textAlign: "left"
                }
              }
              //can be used if we have more legends- in future.
            //   legend: {
            //     position: "bottom",
            //     maxHeight: 100,
            //     labels: {
            //       overflow: 'scroll'
            //     }
            //   }              
            },
            layout: {
              padding: {
                top: 10,
                bottom: 30
              }
            }
          }          
        });
  
      } catch (err) {
        console.error("Chart fetch/render error:", err);
        chartInstruction.innerHTML = `<span style="color: red;">Error loading chart data.</span>`;
      }
    };
  
    // 📌 Load checkboxes on category change
    categorySelect.addEventListener("change", async () => {
      checkboxContainer.innerHTML = "";
      chartInstruction.textContent = "";
  
      if (chart) {
        chart.destroy();
        chart = null;
      }
  
      const category = categorySelect.value;
      const res = await fetch(`/api/trends/values?category=${category}`);
      const { values } = await res.json();
  
      console.log("Values fetched for checkboxes:", values);
  
      if (values.length === 0) {
        checkboxContainer.innerHTML = "<p>No data available for this category.</p>";
        return;
      }
  
      chartInstruction.textContent = "Please select at least one checkbox to view the chart.";
  
      // Add "Select All"
      const selectAllLabel = document.createElement("label");
      selectAllLabel.innerHTML = `
        <input type="checkbox" id="selectAll" />
        <span><strong>Select All</strong></span>
      `;
      checkboxContainer.appendChild(selectAllLabel);
  
      // Add group checkboxes
      values.forEach((val) => {
        const safeVal = val.replace(/"/g, '&quot;');
        const label = document.createElement("label");
        label.innerHTML = `
          <input type="checkbox" class="filled-in group-checkbox" value="${safeVal}" />
          <span>${safeVal}</span>
        `;
        checkboxContainer.appendChild(label);
      });
  
      //Handle "Select All"
      document.getElementById("selectAll").addEventListener("change", (e) => {
        const allBoxes = checkboxContainer.querySelectorAll(".group-checkbox");
        allBoxes.forEach((box) => (box.checked = e.target.checked));
        renderChart();
      });
    });
    
    //Render chart on any checkbox toggle
    checkboxContainer.addEventListener("change", renderChart);
  });
  