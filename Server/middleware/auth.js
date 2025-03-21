const { verifyToken } = require("../utils/tokenUtils");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Add role-specific checks
    const requestedRole = req.baseUrl.includes("client") ? "client" : "realtor";
    if (decoded.role !== requestedRole) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = auth;
