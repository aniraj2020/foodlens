document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  // Emit welcome toast if present (sent via EJS inline data)
  const welcomeMessage = document.body.getAttribute("data-welcome");
  if (welcomeMessage) {
    socket.emit("toast", welcomeMessage);
  }

  // Listen for toast event and display it
  socket.on("toast", (msg) => {
    M.toast({
      html: msg,
      displayLength: 3000,
      classes: "green lighten-1 white-text rounded"
    });
  });

  // // Emit pageVisited for analytics (server handles deduplication & skips admin)
  // socket.emit("pageVisited", { page: window.location.pathname });
});
