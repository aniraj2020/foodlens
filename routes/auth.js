const express = require("express");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/User");

const {
  showRegisterPage,
  registerUser,
  showLoginPage,
  loginUser,
  logoutUser
} = require("../controllers/authController");

const router = express.Router();

// Configure Passport
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return done(null, false, { message: "Incorrect username." });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return done(null, false, { message: "Incorrect password." });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ✅ Login + Register page routes: do NOT pass hideHeader!
router.get("/register", showRegisterPage);
router.post("/register", registerUser);

router.get("/login", showLoginPage);
router.post("/login", loginUser);

router.get("/logout", logoutUser);

module.exports = router;
