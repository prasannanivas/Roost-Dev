// config/gridfs.js
const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");

// Alternatively, once mongoose is connected, you can get the DB handle:
function getGridFsBucket() {
  const db = mongoose.connection.db; // available after mongoose is connected
  // By default, naming is "fs" for the bucket, but you can customize
  return new GridFSBucket(db, { bucketName: "uploads" });
}

module.exports = { getGridFsBucket };
