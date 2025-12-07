import usersRoutes from "./users.js";
import coursesRoutes from "./course.js";
import questionsRoutes from "./questions.js";
import answersRoutes from "./answers.js";
import renderAuthRoutes from "./renderAuth.js";
import renderMainRoutes from "./renderMain.js";
import {
    ensureAuth,
    redirectIfAuthenticated,
    noCacheAuth,
} from "../middleware/auth.js";
import { static as staticDir } from "express";
import path from "path";

const constructorMethod = (app) => {
    app.use("/users", usersRoutes);
    app.use("/courses", coursesRoutes);
    app.use("/questions", questionsRoutes);
    app.use("/answers", answersRoutes);

    app.use("/auth", redirectIfAuthenticated, noCacheAuth, renderAuthRoutes);
    app.use("/main", ensureAuth, noCacheAuth, renderMainRoutes);

    app.use("/public", staticDir("public"));

    // Home page
    app.get("/", (req, res) => {
        return res.render("home", {
            layout: "landing",
            title: "SlackOverflow | Course Q&A Board",
        });
    });

    app.use("/{*splat}", (req, res) => {
        res.status(404).render("error", {
            layout: "auth",
            title: "Page Not Found",
            message: "The page you requested could not be found.",
        });
    });
};
export default constructorMethod;
