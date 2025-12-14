import express from "express";
import configRoutes from "./routes/index.js";
import handlebars from "express-handlebars";
import { requestLogger } from "./middleware/requestLogger.js";
import { methodOverride } from "./middleware/methodOverride.js";
import { sessionConfig } from "./middleware/sessionConfig.js";
import { setSessionLocals } from "./middleware/auth.js";
import lastSeenMiddleware from "./middleware/lastSeen.js";

const app = express();

// middlewares
app.use("/public", express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionConfig);
app.use(lastSeenMiddleware);

app.use(methodOverride);

// handlebars setup
app.use(setSessionLocals);
app.use(requestLogger);
app.engine(
    "handlebars",
    handlebars.engine({
        defaultLayout: "main",
        helpers: {
            eq: (a, b) => a === b,
            notEq: (a, b) => a !== b,
            eqStr: (a, b) => String(a) === String(b),
            or: (a, b) => a || b,
            and: (a, b) => a && b,
            not: (a) => !a,
            json: (obj) => JSON.stringify(obj),
        },
    })
);
app.set("view engine", "handlebars");

configRoutes(app);

app.listen(3000, () => {
    console.log("We've now got a server!");
    console.log("Your routes will be running on http://localhost:3000");
});
