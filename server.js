const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const http = require("http");
const socketio = require("socket.io");
const sharedSession = require("express-socket.io-session");
const User = require("./models/User");

// Route imports
const homeRoutes = require("./routes/home");
const foodTypeRoutes = require('./routes/type');
const demographicsRoutes = require('./routes/demographics');
const trendsRoutes = require('./routes/trends'); 
const insightRoutes = require('./routes/insight');
const predictRoutes = require('./routes/predict');
const authRoutes = require('./routes/auth');
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const { ensureAuthenticated } = require("./middleware/auth");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Connect DB
connectDB();

// Shared session middleware
const sessionMiddleware = session({
  secret: "foodlens_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: "lax" }
});

// Apply session to both Express and Socket.IO
app.use(sessionMiddleware);
io.use(sharedSession(sessionMiddleware, { autoSave: true }));

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(passport.initialize());
app.use(passport.session());

// View engine
app.set("view engine", "ejs");

// Store io for use in routes (if needed)
app.set("io", io);

// API Routes
app.use("/", homeRoutes);
app.use("/api/type", foodTypeRoutes);
app.use("/api/demographics", demographicsRoutes);
app.use("/api/trends", trendsRoutes);
app.use("/api/insight", insightRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/user", userRoutes);
app.use("/", authRoutes);
app.use("/", adminRoutes);

// View Routes
app.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const toast = req.session.toastMessage || null;
    delete req.session.toastMessage;

    const userFromDB = await User.findById(req.user._id).lean();

    res.render("home", {
      user: {
        ...req.user,
        lastFilters: userFromDB.lastFilters,
        lastActivity: userFromDB.lastActivity
      },
      welcomeMessage: toast
    });
  } catch (err) {
    console.error("Error loading home page user data:", err);
    res.redirect("/logout");
  }
});

app.get("/type", ensureAuthenticated, (req, res) => res.render("food_type", { user: req.user }));
app.get("/demographics", ensureAuthenticated, (req, res) => res.render("demographics", { user: req.user }));
app.get("/combined", ensureAuthenticated, (req, res) => res.render("combined_trends", { user: req.user }));
app.get("/insight", ensureAuthenticated, (req, res) => res.render("insight", { user: req.user }));
app.get("/predict", ensureAuthenticated, (req, res) => res.render("predict", { user: req.user }));
app.get("/profile", ensureAuthenticated, (req, res) => res.render("profile", { user: req.user }));

// Socket.IO: Track unique active users
const activeUsers = new Set();

io.on("connection", (socket) => {
  const userId = socket.handshake?.session?.passport?.user;
  console.log("Socket connected. User ID:", userId);

  if (userId) {
    socket.userId = userId;
    activeUsers.add(userId);
    io.emit("activeUserCount", activeUsers.size);
  }

    // Add this for toast messages to work
  socket.on("toast", (msg) => {
    // console.log("Toast received from client:", msg);
    socket.emit("toast", msg); // echo back to client
  });

  socket.on("disconnect", () => {
    const stillConnected = Array.from(io.sockets.sockets.values()).some(
      s => s.userId === socket.userId
    );

    if (!stillConnected && socket.userId) {
      activeUsers.delete(socket.userId);
      io.emit("activeUserCount", activeUsers.size);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () =>
  console.log(`Server running with Socket.IO on http://localhost:${PORT}`)
);
