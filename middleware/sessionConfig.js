import session from 'express-session';
import dotenv from 'dotenv';
dotenv.config();

const sessionConfig = session({
    name: 'SlackOverflowSession',
    secret: process.env.SESSION_SECRET || 'team18-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2, // 2 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    },
});

export { sessionConfig }