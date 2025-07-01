const path = require("node:path");
const db = require("./db/queries");
const express = require("express");
const bcrypt = require("bcrypt");
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

app.post("/sign-up", async (req, res, next) => {
    try {
        const hashedpassword = await bcrypt.hash(req.body.password, 10);
        await db.createUser(req.username, hashedpassword);
        res.redirect("log-in");
    } catch (err) {
        return next(err);
    }
});

app.use((req, res) => {
    res.render("404");
});
app.listen(3000, () => console.log("app listening on port 3000!"));
