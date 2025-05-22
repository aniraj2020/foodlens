document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded!");

  fetch("/api/type") 
    .then(res => res.json())
    .then(data => {
      console.log("Data fetched:", data.labels, data.values);

      const ctx = document.getElementById("pieChart").getContext("2d");
      new Chart(ctx, {
        type: "pie",
        data: {
          labels: data.labels,
          datasets: [{
            label: "Food Insecurity",
            data: data.values,
            backgroundColor: [
              "#e57373", "#64b5f6", "#81c784", "#ffd54f", "#ba68c8", "#4dd0e1"
            ]
          }]
        },
        options: {
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  size: 16 
                },
                padding: 12
              }
            }
          }
        }
      });
    })
    .catch(err => {
      console.error("Chart loading error:", err);
    });

    fetch("/api/user/filters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chart: "type",
      filters: { viewed: true }
    })
});

});
