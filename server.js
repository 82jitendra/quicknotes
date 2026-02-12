require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const app = express();

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

// ===== Middleware =====
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "secretkey",
  resave: false,
  saveUninitialized: false
}));

// ===== Models =====
const User = require("./models/User");
const Note = require("./models/Note");

// ===== Routes =====

// Home
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Register Page
app.get("/register", (req, res) => {
  res.render("register");
});

// Register User
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.send("User already exists");

    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, password: hash });

    res.redirect("/login");
  } catch (err) {
    res.send("Error registering user");
  }
});

// Login Page
app.get("/login", (req, res) => {
  res.render("login");
});

// Login User
app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.send("User not found");

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.send("Wrong password");

    req.session.userId = user._id;
    res.redirect("/dashboard");
  } catch (err) {
    res.send("Login error");
  }
});

// Dashboard
app.get("/dashboard", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  try {
    const notes = await Note.find({ user: req.session.userId });
    res.render("dashboard", { notes });
  } catch (err) {
    res.send("Error loading dashboard");
  }
});

// Add Note
app.post("/add-note", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  try {
    await Note.create({
      content: req.body.content,
      user: req.session.userId
    });

    res.redirect("/dashboard");
  } catch (err) {
    res.send("Error adding note");
  }
});

// Delete Note
app.get("/delete/:id", async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard");
  } catch (err) {
    res.send("Error deleting note");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// ===== PORT FIX (IMPORTANT FOR RENDER) =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
