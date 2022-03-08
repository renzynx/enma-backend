import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.get('/', passport.authenticate('discord', { prompt: 'consent' }));
router.get('/callback', passport.authenticate('discord'), (_req, res) => res.redirect('http://localhost:3000/dashboard'));

export default router;
