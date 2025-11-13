import usersRoutes from "./users.js";
import coursesRoutes from "./course.js";
import renderAuthRoutes from "./renderAuth.js";
import renderDashboardRoutes from "./renderDashboard.js";
import { ensureAuth, redirectIfAuthenticated, noCacheAuth } from "../middleware/auth.js";
import { static as staticDir } from 'express';
import path from 'path';

const constructorMethod = (app) => {
    app.use("/users", usersRoutes);
    app.use("/courses", coursesRoutes);
    app.get("/", (req, res) => {
        res.redirect('auth/sign-in');
    });

    app.use("/auth", redirectIfAuthenticated, noCacheAuth, renderAuthRoutes);
    app.use('/dashboard', ensureAuth, renderDashboardRoutes);

    app.use('/public', staticDir('public'));
    app.use("/{*splat}", (req, res) => {
        return res.status(404).send("Page not Found!");
    });
};
export default constructorMethod;
