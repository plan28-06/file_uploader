const nodepath = require("node:path");
const db = require("./db/queries");
const express = require("express");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const passport = require("passport");
const session = require("express-session");
const { error } = require("node:console");
const multer = require("multer");
const cloudinary = require("./cloudinary");
const fs = require("fs");
const upload = multer({ dest: "uploads/" }); // temp file storage
require("./passport.js");
const app = express();
app.set("views", nodepath.join(__dirname, "views"));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res, next) => {
    if (req.user) {
        res.redirect("/folders/");
    } else {
        res.redirect("/log-in");
    }
});

app.get(/^\/folders\/(.*)/, async (req, res) => {
    if (!req.user) {
        return res.redirect("/log-in");
    }

    const fullPath = req.params[0] || "";
    const pathSegments = fullPath.split("/").filter(Boolean);
    const parentId = pathSegments.at(-1) || null;

    try {
        const content = await db.getFolderContents(req.user.id, pathSegments);
        res.render("index", {
            user: req.user,
            path: pathSegments,
            content: content,
            parentId: parentId,
        });
    } catch (err) {
        console.error("Error fetching folder contents:", err);
        res.status(500).render("500");
    }
});

app.post("/deletefolder/:id", async (req, res, next) => {
    try {
        const pathString = req.body.path;
        const pathSegments = pathString.split("/").filter(Boolean);

        // Remove the folder being deleted from the path segments
        const parentPath = pathSegments.slice(0, -1).join("/");

        await db.deleteFolderRecursive(req.user.id, req.params.id);

        // Redirect to the parent folder
        const redirectPath = parentPath
            ? `/folders/${parentPath}`
            : "/folders/";
        res.redirect(redirectPath);
    } catch (err) {
        console.error("Error deleting folder:", err);
        res.redirect("/folders/");
    }
});

app.post("/create-folder", async (req, res, next) => {
    try {
        await db.createFolder(
            req.body.parentId || null,
            req.body.folderName,
            true,
            req.user.id
        );
        // redirect to the original folder path
        const currentPath = req.body.path
            ? `/folders/${req.body.path}`
            : "/folders/";
        res.redirect(currentPath);
    } catch (err) {
        console.log(err);
        res.redirect("/folders"); // fallback
    }
});

app.post("/delete/:id", async (req, res, next) => {
    const id = req.params.id;
    if (!req.user) {
        res.redirect("/");
    }
    try {
        await db.deleteFile(req.user.id, id);
        const currentPath = req.body.path
            ? `/folders/${req.body.path}`
            : "/folders/";
        res.redirect(currentPath);
    } catch (err) {
        console.log(err);
        res.redirect("/folders/");
    }
});
app.post("/upload", upload.single("filename"), async (req, res) => {
    try {
        const filePath = req.file.path;
        const { parentId, path } = req.body;
        const originalName = req.file.originalname;
        const baseName = nodepath.parse(originalName).name;
        const result = await cloudinary.uploader.upload(filePath, {
            folder: "file_uploader",
            resource_type: "raw",
            use_filename: true,
            unique_filename: false,
            public_id: baseName,
        });
        if (!req.user) {
            res.redirect("/");
        }
        fs.unlinkSync(filePath);
        await db.createFile(
            req.user.id,
            req.file.originalname,
            result.secure_url,
            parentId
        );
        const redirectPath = path ? `/folders/${path}` : "/folders/";
        res.redirect(redirectPath);
    } catch (error) {
        console.log(error);
    }
});

// O-Auth
app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/login",
        failureFlash: true,
        successRedirect: "/",
    })
);

app.get(
    "/auth/github",
    passport.authenticate("github", { scope: ["user:email"] })
);

app.get(
    "/auth/github/callback",
    passport.authenticate("github", {
        failureRedirect: "/log-in",
        failureFlash: true,
        successRedirect: "/",
    })
);

app.get("/log-in", (req, res) => {
    const error = req.flash("error");
    res.render("login", { user: req.user, error: error });
});

app.get("/sign-up", (req, res, next) => {
    const error = req.flash("error");
    res.render("signup", { user: req.user, error: error });
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
        if (err.code === "P2002") {
            req.flash("error", "Username already exists");
            res.redirect("/sign-up");
        }
        req.flash("error", "Username already exists");
        res.redirect("/sign-up");
    }
});

app.use((req, res) => {
    res.render("404");
});
app.listen(3000, () => console.log("app listening on port 3000!"));
