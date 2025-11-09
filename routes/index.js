import usersRoutes from "./users.js";

const constructorMethod = (app) => {
    app.use("/users", usersRoutes);

    app.use("/{*splat}", (req, res) => {
        return res.status(404).send("Page not Found!");
    });
};
export default constructorMethod;
