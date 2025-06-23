require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");
const session = require("express-session");

const User = require("./models/User");
const Movie = require("./models/Movie");

const app = express();

app.use(session({
  secret: '7b54cb0fe654d3a159b9fbb9edb30e12f0294369dce009e8b6b36549c58ab442',
  resave: false,
  saveUninitialized: true
}));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => res.render("index"));
app.get("/signup", (req, res) => res.render("signup"));
app.get("/login", (req, res) => {
  const email = req.query.email || "";
  res.render("login", { email });
});

// Register
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Please fill in all fields." });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "Email already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    return res.status(200).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Registration error:", err);
    return res.status(500).json({ message: "Server error during registration." });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.render("login", { error: "User not found", email });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.render("login", { error: "Invalid credentials", email });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("authToken", token, { httpOnly: true });
    return res.redirect("/main");
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.render("login", { error: "Something went wrong", email });
  }
});

// Main Page (Protected)
app.get("/main", (req, res) => {
  const token = req.cookies.authToken;
  if (!token) return res.redirect("/login");

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.redirect("/login");
    res.render("main", { userId: decoded.userId });
  });
});

// My List Page
app.get("/mylist", (req, res) => {
  const token = req.cookies.authToken;
  if (!token) return res.redirect("/login");

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.redirect("/login");

    const userMovies = await Movie.find({ userId: decoded.userId });
    res.render("mylist", { userId: decoded.userId, userMovies });
  });
});

// Add Movie to My List (POST /mylist/add)
app.post("/mylist/add", (req, res) => {
  const { movieId, movieTitle, imageUrl } = req.body;
  const token = req.cookies.authToken;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  if (typeof movieId !== "string" || typeof movieTitle !== "string" || typeof imageUrl !== "string") {
    return res.status(400).json({ message: "Invalid movie data format" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    const exists = await Movie.findOne({ userId: decoded.userId, movieId });
    if (exists) return res.status(400).json({ message: "Movie already in list" });

    const newMovie = new Movie({
      userId: decoded.userId,
      movieId,
      movieTitle,
      imageUrl
    });

    await newMovie.save();
    return res.status(200).json({ message: "Movie added to your list" });
  });
});

// Get My List (GET /api/mylist)
app.get("/api/mylist", (req, res) => {
  const token = req.cookies.authToken;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    try {
      const movies = await Movie.find({ userId: decoded.userId });
      res.status(200).json({ movies });
    } catch (err) {
      console.error("❌ Failed to fetch movies:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// Remove Movie (DELETE /mylist/remove/:id)
app.delete("/mylist/remove/:id", (req, res) => {
  const token = req.cookies.authToken;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    try {
      await Movie.deleteOne({ _id: req.params.id, userId: decoded.userId });
      res.status(200).json({ message: "Movie removed from your list" });
    } catch (err) {
      console.error("❌ Error deleting movie:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// Logout
app.get("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.log("Session destruction error:", err);
        return res.status(500).send("Logout failed.");
      } else {
        return res.redirect("/");
      }
    });
  } else {
    res.redirect("/");
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
