import usersRoutes from "./users.js";
import coursesRoutes from "./course.js";
import authRenderRoutes from "./authRender.js";

import { static as staticDir } from 'express';
import path from 'path';

const constructorMethod = (app) => {
    app.use("/users", usersRoutes);
    app.use("/courses", coursesRoutes);
    app.get("/", (req, res) => {
        res.redirect('auth/sign-in');
    });

    app.use("/auth", authRenderRoutes);

    app.use('/public', staticDir('public'));
    app.use("/{*splat}", (req, res) => {
        return res.status(404).send("Page not Found!");
    });
};
export default constructorMethod;
