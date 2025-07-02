const path = require("node:path");
const db = require("./db/queries");
const express = require("express");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const passport = require("passport");
const session = require("express-session");
require("./passport.js");

const app = express();
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res, next) => {
    if (req.user) {
        res.render("index", { user: req.user });
    } else {
        res.redirect("/log-in");
    }
});

// O-Auth
app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/");
    }
);

app.get("/log-in", (req, res) => {
    const error = req.flash("error");
    res.render("login", { user: req.user, error: error });
});

app.get("/sign-up", (req, res, next) => {
    res.render("signup");
});

app.post(
    "/log-in",
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/log-in",
        failureFlash: true,
    })
);

app.get("/log-out", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

app.post("/sign-up", async (req, res, next) => {
    try {
        const hashedpassword = await bcrypt.hash(req.body.password, 10);
        await db.createUser(req.body.username, hashedpassword);
        res.redirect("/log-in");
    } catch (err) {
        if (err.code === "23505") {
            return res.status(400).send("Username already exists");
        }
        res.status(500).send(`Error creating user: ${err.message}`);
    }
});

app.use((req, res) => {
    res.render("404");
});
app.listen(3000, () => console.log("app listening on port 3000!"));
