import { Router } from 'express';
const router = Router();

// Dashboard 
router.get('/', (req, res) => {
    res.render('dashboard', {
        layout: 'main',
        title: 'Dashboard',
        page: "Dashboard"
    });
});

export default router;
