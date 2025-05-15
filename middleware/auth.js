// middleware/auth.js

// Check if user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
  }
  
  // Check if user is an admin
  function ensureAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === "admin") return next();
    res.status(403).send("Access denied. Admins only.");
  }
  
  module.exports = {
    ensureAuthenticated,
    ensureAdmin
  };
  