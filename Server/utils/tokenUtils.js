const jwt = require("jsonwebtoken");

const generateTokens = (payload) => {
  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role, // 'client' or 'realtor'
  };

  const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(
    tokenPayload,
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d",
    }
  );
  return { accessToken, refreshToken };
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

module.exports = { generateTokens, verifyToken };
