require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const app = express();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "secretkey",
  resave: false,
  saveUninitialized: false
}));

const User = require("./models/User");
const Note = require("./models/Note");

// Home
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Register
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, password: hash });
  res.redirect("/login");
});

// Login
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.send("User not found");

  const valid = await bcrypt.compare(req.body.password, user.password);
  if (!valid) return res.send("Wrong password");

  req.session.userId = user._id;
  res.redirect("/dashboard");
});

// Dashboard
app.get("/dashboard", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const notes = await Note.find({ user: req.session.userId });
  res.render("dashboard", { notes });
});

// Add Note
app.post("/add-note", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  await Note.create({
    content: req.body.content,
    user: req.session.userId
  });

  res.redirect("/dashboard");
});

// Delete Note
app.get("/delete/:id", async (req, res) => {
  await Note.findByIdAndDelete(req.params.id);
  res.redirect("/dashboard");
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
