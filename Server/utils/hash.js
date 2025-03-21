// utils/hash.js
const bcrypt = require("bcryptjs");

async function hashPassword(plainText) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

async function comparePassword(plainText, hashed) {
  return bcrypt.compare(plainText, hashed);
}

module.exports = { hashPassword, comparePassword };
