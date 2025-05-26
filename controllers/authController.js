const User = require("../models/User");
const passport = require("passport");

// Show register page
const showRegisterPage = (req, res) => {
  res.render("register", {
    title: "Register",
    error: null
  });
};

// Handle registration
const registerUser = async (req, res) => {
  let { username, password } = req.body;

  username = username.trim().toLowerCase();
  password = password.trim();

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!username || !password) {
    return res.render("register", {
      title: "Register",
      error: "All fields are required."
    });
  }

  if (!passwordRegex.test(password)) {
    return res.render("register", {
      title: "Register",
      error: "Password must be at least 8 characters long and include 1 letter, 1 number, and 1 special character."
    });
  }

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.render("register", {
        title: "Register",
        error: "Username already exists!"
      });
    }

    const newUser = new User({ username, password });
    await newUser.save();

    req.session.toastMessage = `Welcome ${newUser.username}`;
    res.redirect("/login");
  } catch (err) {
    console.error("Registration error:", err.message);
    res.render("register", {
      title: "Register",
      error: "Registration failed. Please try again."
    });
  }
};

// Show login page
const showLoginPage = (req, res) => {
  res.render("login", {
    title: "Login",
    error: null
  });
};

// Handle login
const loginUser = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.render("login", {
        title: "Login",
        error: info.message
      });
    }

    req.logIn(user, (err) => {
      if (err) return next(err);
      req.session.toastMessage = `Welcome ${user.username}`;
      return res.redirect("/dashboard");
    });
  })(req, res, next);
};

// Handle logout
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
  logoutUser
};
