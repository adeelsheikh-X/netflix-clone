const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  movieId: { type: String, required: true },
  movieTitle: { type: String, required: true },
  imageUrl: { type: String, required: true },
});

module.exports = mongoose.model("Movie", movieSchema);
