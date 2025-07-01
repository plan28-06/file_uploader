const path = require("node:path");
const { Pool } = require("pg");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const app = express();
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res, next) => {
    res.render("index");
});

app.get("/log-in", (req, res, next) => {
    res.render("login");
});

app.get("/sign-up", (req, res, next) => {
    res.render("signup");
});

app.post("/sign-up", (req, res, next) => {
    res.redirect("/log-in");
});

app.use((req, res) => {
    res.render("404");
});
app.listen(3000, () => console.log("app listening on port 3000!"));
