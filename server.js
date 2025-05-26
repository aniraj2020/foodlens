const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const http = require("http");
const socketio = require("socket.io");
const sharedSession = require("express-socket.io-session");
const expressLayouts = require("express-ejs-layouts");
const User = require("./models/User");

// Route imports
const homeRoutes = require("./routes/home");
const foodTypeRoutes = require("./routes/type");
const demographicsRoutes = require("./routes/demographics");
const trendsRoutes = require("./routes/trends");
const insightRoutes = require("./routes/insight");
const predictRoutes = require("./routes/predict");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const { ensureAuthenticated } = require("./middleware/auth");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Connect to DB
connectDB();

// Session setup
const sessionMiddleware = session({
  secret: "foodlens_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: "lax" }
});
app.use(sessionMiddleware);
io.use(sharedSession(sessionMiddleware, { autoSave: true }));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());
app.use(passport.session());

// View engine and layout
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");
app.set("io", io);

// ===== PUBLIC ROUTES =====
app.get("/", (req, res) => {
  res.render("landing", { title: "Welcome to FoodLens" });
});

app.get("/about", (req, res) => {
  res.render("about", { title: "About Us" });
});

app.get("/contact", (req, res) => {
  res.render("contact", { title: "Contact Us" });
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

app.get("/register", (req, res) => {
  res.render("register", { title: "Register" });
});

// ===== AUTHENTICATED ROUTES =====
app.get("/dashboard", ensureAuthenticated, async (req, res) => {
  try {
    const toast = req.session.toastMessage || null;
    delete req.session.toastMessage;

    const userFromDB = await User.findById(req.user._id).lean();

    res.render("home", {
      title: "Dashboard",
      layout: "layout",
      hideHeader: true,
      hideFooter: true,
      user: {
        ...req.user,
        lastFilters: userFromDB.lastFilters,
        lastActivity: userFromDB.lastActivity
      },
      welcomeMessage: toast
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.redirect("/logout");
  }
});

app.get("/type", ensureAuthenticated, (req, res) =>
  res.render("food_type", { title: "Food Insecurity Types", user: req.user, layout: false })
);

app.get("/demographics", ensureAuthenticated, (req, res) =>
  res.render("demographics", { title: "Demographics", user: req.user, layout: false })
);

app.get("/combined", ensureAuthenticated, (req, res) =>
  res.render("combined_trends", { title: "Combined Trends", user: req.user, layout: false })
);

app.get("/insight", ensureAuthenticated, (req, res) =>
  res.render("insight", { title: "Insights", user: req.user, layout: false })
);

app.get("/predict", ensureAuthenticated, (req, res) =>
  res.render("predict", { title: "Predict Future", user: req.user, layout: false })
);

app.get("/profile", ensureAuthenticated, (req, res) =>
  res.render("profile", { title: "Profile", user: req.user, layout: false })
);

// ===== API & AUTH ROUTES =====
app.use("/", homeRoutes);
app.use("/api/type", foodTypeRoutes);
app.use("/api/demographics", demographicsRoutes);
app.use("/api/trends", trendsRoutes);
app.use("/api/insight", insightRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/user", userRoutes);
app.use("/", authRoutes);
app.use("/", adminRoutes);

// ===== SOCKET.IO =====
const activeUsers = new Set();

io.on("connection", (socket) => {
  const userId = socket.handshake?.session?.passport?.user;
  console.log("Socket connected. User ID:", userId);

  if (userId) {
    socket.userId = userId;
    activeUsers.add(userId);
    io.emit("activeUserCount", activeUsers.size);
  }

  socket.on("toast", (msg) => {
    socket.emit("toast", msg);
  });

  socket.on("disconnect", () => {
    const stillConnected = Array.from(io.sockets.sockets.values()).some(
      (s) => s.userId === socket.userId
    );

    if (!stillConnected && socket.userId) {
      activeUsers.delete(socket.userId);
      io.emit("activeUserCount", activeUsers.size);
    }
  });
});

// Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
