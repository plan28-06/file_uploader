const prisma = require("./db/prisma");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await prisma.user.findUnique({
                where: { username: username },
            });
            if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return done(null, false, { message: "Incorrect password" });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: id },
        });
        done(null, user);
    } catch (err) {
        done(err);
    }
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.BASE_URL + "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            const user = await prisma.user.upsert({
                where: { providerID: profile.id },
                update: {},
                create: {
                    username: profile.displayName,
                    provider: "google",
                    providerID: profile.id,
                },
            });
            return done(null, user);
        }
    )
);

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.BASE_URL + "/auth/github/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const user = await prisma.user.upsert({
                    where: { providerID: profile.id },
                    update: {},
                    create: {
                        username:
                            profile.username ||
                            profile.displayName ||
                            "Unknown",
                        provider: "github",
                        providerID: profile.id,
                    },
                });
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);
