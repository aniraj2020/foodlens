document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  // Update active user count (for admin panel)
  socket.on("activeUserCount", function (count) {
    const el = document.getElementById("activeCount");
    if (el) el.innerText = count;
  });

  // Emit page visit (server handles deduplication + skips admin)
  socket.emit("pageVisited", { page: window.location.pathname });
});
