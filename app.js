import express from "express";
import configRoutes from "./routes/index.js";
import handlebars from 'express-handlebars';

const app = express();

const rewriteUnsupportedBrowserMethods = (req, res, next) => {
    // For post req, _method=PUT  works as put req
    if (req.body && req.body._method) {
        req.method = req.body._method;
        delete req.body._method;
    }
    next();
};

// middlewares
app.use('/public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rewriteUnsupportedBrowserMethods);

app.engine('handlebars', handlebars.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

configRoutes(app);

app.listen(3000, () => {
    console.log("We've now got a server!");
    console.log("Your routes will be running on http://localhost:3000");
});
