document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  // The server will pass this value inline in EJS
  const welcomeMessage = document.body.getAttribute("data-welcome");

  if (welcomeMessage) {
    socket.emit("toast", welcomeMessage);
  }

  socket.on("toast", (msg) => {
    M.toast({
      html: msg,
      displayLength: 3000,
      classes: "green lighten-1 white-text rounded"
    });
  });
});
