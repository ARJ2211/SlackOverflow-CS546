import usersRoutes from "./users.js";
import coursesRoutes from "./course.js";
import renderAuthRoutes from "./renderAuth.js";
import renderMainRoutes from "./renderMain.js";
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
    app.use('/main', ensureAuth, renderMainRoutes);

    app.use('/public', staticDir('public'));
    app.use("/{*splat}", (req, res) => {
        res.status(404).render('error', {
            layout: 'auth',
            title: 'Page Not Found',
            message: 'The page you requested could not be found.'
        });
    });
};
export default constructorMethod;
