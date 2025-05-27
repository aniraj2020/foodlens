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
const UsageLog = require("./models/UsageLog");

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

connectDB();

const sessionMiddleware = session({
  secret: "foodlens_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: "lax" }
});
app.use(sessionMiddleware);
io.use(sharedSession(sessionMiddleware, { autoSave: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());
app.use(passport.session());
app.set("view engine", "ejs");
app.set("io", io);

const normalizePageName = (raw) => {
  const path = raw.toLowerCase().replace(/^\/+/, "").split("?")[0];
  if (path.includes("type")) return "type";
  if (path.includes("demographics")) return "demographics";
  if (path.includes("predict")) return "predict";
  if (path.includes("combined")) return "combined";
  if (path.includes("insight")) return "insight";
  if (path === "") return "/";
  return path;
};

// app.use(async (req, res, next) => {
//   if (
//     req.user &&
//     req.user.role !== 'admin' &&
//     req.method === 'GET' &&
//     !req.path.startsWith('/socket.io') &&
//     !req.path.includes('.')
//   ) {
//     try {
//       const cleanPage = normalizePageName(req.path);
//       const recent = await UsageLog.findOne({ userId: req.user._id, page: cleanPage }).sort({ timestamp: -1 });
//       if (!recent || (Date.now() - new Date(recent.timestamp).getTime()) > 3000) {
//         await UsageLog.create({
//           userId: req.user._id,
//           username: req.user.username,
//           page: cleanPage,
//           timestamp: new Date()
//         });
//       }
//     } catch (err) {
//       console.error("Middleware usage log error:", err.message);
//     }
//   }
//   next();
// });

app.use("/", homeRoutes);
app.use("/api/type", foodTypeRoutes);
app.use("/api/demographics", demographicsRoutes);
app.use("/api/trends", trendsRoutes);
app.use("/api/insight", insightRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/user", userRoutes);
app.use("/", authRoutes);
app.use("/", adminRoutes);

const logFeatureUsage = async (req, pageName) => {
  if (req.user.role === 'admin') return;
  try {
    await UsageLog.create({
      userId: req.user._id,
      username: req.user.username,
      page: pageName
    });
  } catch (err) {
    console.error("UsageLog error:", err.message);
  }
};

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
    console.error("Home page error:", err);
    res.redirect("/logout");
  }
});

app.get("/type", ensureAuthenticated, async (req, res) => {
  await logFeatureUsage(req, "type");
  res.render("food_type", { user: req.user });
});

app.get("/demographics", ensureAuthenticated, async (req, res) => {
  await logFeatureUsage(req, "demographics");
  res.render("demographics", { user: req.user });
});

app.get("/combined", ensureAuthenticated, async (req, res) => {
  await logFeatureUsage(req, "combined");
  res.render("combined_trends", { user: req.user });
});

app.get("/insight", ensureAuthenticated, async (req, res) => {
  await logFeatureUsage(req, "insight");
  res.render("insight", { user: req.user });
});

app.get("/predict", ensureAuthenticated, async (req, res) => {
  await logFeatureUsage(req, "predict");
  res.render("predict", { user: req.user });
});

app.get("/profile", ensureAuthenticated, (req, res) => {
  res.render("profile", { user: req.user });
});

const activeUsers = new Set();

io.on("connection", (socket) => {
  const userId = socket.handshake?.session?.passport?.user;
  if (userId) {
    socket.userId = userId;
    activeUsers.add(userId);
    io.emit("activeUserCount", activeUsers.size);
  }

  socket.on("toast", (msg) => {
    socket.emit("toast", msg);
  });

  socket.on("pageVisited", async ({ page }) => {
    if (!userId) return;
    try {
      const user = await User.findById(userId).lean();
      if (!user || user.role === "admin") return;

      const cleanPage = normalizePageName(page);

      const recent = await UsageLog.findOne({
        userId: user._id,
        page: cleanPage
      }).sort({ timestamp: -1 });

      if (!recent || (Date.now() - new Date(recent.timestamp).getTime()) > 3000) {
        await UsageLog.create({
          userId: user._id,
          username: user.username,
          page: cleanPage,
          timestamp: new Date()
        });
        io.emit("refreshUsageAnalytics");
        io.emit("refreshUserInfo"); 
      }
    } catch (err) {
      console.error("Error in pageVisited log:", err.message);
    }
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

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  server.listen(PORT, () =>
    console.log(`Server running with Socket.IO on http://localhost:${PORT}`)
  );
}

module.exports = app;
