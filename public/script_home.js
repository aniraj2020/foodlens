document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  // console.log("Socket.IO client initialized"); // Debug line

  // Listen for toast event and display it
  socket.on("toast", (msg) => {
    // console.log("Toast received:", msg); // Debug line
    M.toast({
      html: msg,
      displayLength: 3000,
      classes: "green lighten-1 white-text rounded"
    });
  });

  // Optional: Emit pageVisited for analytics (you can uncomment this)
  // socket.emit("pageVisited", { page: window.location.pathname });
});
