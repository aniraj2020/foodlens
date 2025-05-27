document.addEventListener("DOMContentLoaded", async () => {
  const socket = io();
  const ctx = document.getElementById("pieChart").getContext("2d");

  // Reusable function to emit analytics event (but skip admin panel)
  function emitPageVisitIfNeeded() {
    if (window.location.pathname !== "/admin-panel") {
      socket.emit("pageVisited", { page: window.location.pathname });
    }
  }

  try {
    // Load pie chart data
    const res = await fetch("/api/type");
    const data = await res.json();

    new Chart(ctx, {
      type: "pie",
      data: {
        labels: data.labels,
        datasets: [{
          label: "Food Insecurity",
          data: data.values,
          backgroundColor: [
            "#e57373", "#64b5f6", "#81c784",
            "#ffd54f", "#ba68c8", "#4dd0e1"
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = context.raw;
                return `${label}: ${value} cases`;
              }
            }
          },
          legend: {
            position: "bottom",
            labels: {
              font: { size: 16 },
              padding: 12
            }
          }
        }
      }
    });

    // Save last viewed activity
    await fetch("/api/user/filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chart: "type",
        filters: { viewed: true }
      })
    });

    // Emit analytics update
    emitPageVisitIfNeeded();

  } catch (err) {
    console.error("Error in /type chart or saving filters:", err);
  }
});
