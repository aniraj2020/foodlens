const User = require("../models/User");
const passport = require("passport");

// Show register page
const showRegisterPage = (req, res) => {
  res.render("register", { error: null });
};

// Handle registration
const registerUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("register", { error: "All fields are required." });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render("register", { error: "Username already exists!" });
    }

    const newUser = new User({ username, password });
    await newUser.save();

    // ✅ Welcome message after registration (optional)
    req.session.toastMessage = `👋 Welcome ${newUser.username}`;
    res.redirect("/login");
  } catch (err) {
    console.error("Registration error:", err.message);
    res.render("register", { error: "Registration failed. Please try again." });
  }
};

// Show login page
const showLoginPage = (req, res) => {
  res.render("login", { error: null });
};

// Handle login
const loginUser = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.render("login", { error: info.message });

    req.logIn(user, (err) => {
      if (err) return next(err);

      // ✅ Show a toast on successful login
      req.session.toastMessage = `Welcome ${user.username}`;
      return res.redirect("/dashboard"); // ✅ FIX: redirect to dashboard
    });
  })(req, res, next);
};

// Logout
const logoutUser = (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
};

module.exports = {
  showRegisterPage,
  registerUser,
  showLoginPage,
  loginUser,
  logoutUser,
};
