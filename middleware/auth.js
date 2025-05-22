// middleware/auth.js

// Check if user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
  }
  
  // Check if user is an admin
  function ensureAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === "admin") return next();
    return res.status(403).render("access_denied");
  }
  
  module.exports = {
    ensureAuthenticated,
    ensureAdmin
  };
  