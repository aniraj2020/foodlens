const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const http = require("http");
const socketio = require("socket.io");
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

const { ensureAuthenticated, ensureAdmin } = require("./middleware/auth");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketio(server); // Initialize socket.io

// Store io in app locals if needed later in routes
app.set("io", io);

// Connect DB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Session + Passport config
app.use(session({
  secret: "foodlens_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: "lax"
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// View engine
app.set("view engine", "ejs");

// API Routes
app.use("/", homeRoutes);
app.use("/api/type", foodTypeRoutes);
app.use("/api/demographics", demographicsRoutes);
app.use("/api/trends", trendsRoutes);
app.use("/api/insight", insightRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/user", userRoutes);

// Auth Routes (login, register, logout)
app.use("/", authRoutes);

// Admin-specific routes
app.use("/", adminRoutes);

// View Routes (protected)
app.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const toast = req.session.toastMessage || null;
    delete req.session.toastMessage;

    const userFromDB = await User.findById(req.user._id).lean();

    res.render("home", {
      user: {
        ...req.user,  // keeps session fields like `username`, `role`
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


app.get("/type", ensureAuthenticated, (req, res) => {
  res.render("food_type", { user: req.user });
});

app.get("/demographics", ensureAuthenticated, (req, res) => {
  res.render("demographics", { user: req.user });
});

app.get("/combined", ensureAuthenticated, (req, res) => {
  res.render("combined_trends", { user: req.user });
});

app.get("/insight", ensureAuthenticated, (req, res) => {
  res.render("insight", { user: req.user });
});

app.get("/predict", ensureAuthenticated, (req, res) => {
  res.render("predict", { user: req.user });
});

app.get("/profile", ensureAuthenticated, (req, res) => {
  res.render("profile", { user: req.user });
});

// Socket.IO connection logging and toast handling
io.on("connection", (socket) => {
  console.log("A user connected");

  // Broadcast toast message
  socket.on("toast", (msg) => {
    socket.emit("toast", msg); // Emit only to the same user
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start server with socket.io
const PORT = process.env.PORT || 3001;
server.listen(PORT, () =>
  console.log(`Server running with Socket.IO on http://localhost:${PORT}`)
);
