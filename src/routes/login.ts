import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.get('/', passport.authenticate('discord'));
router.get('/callback', passport.authenticate('discord'), (_req, res) => res.redirect(`${process.env.FRONTEND_DOMAIN}/dashboard`));

export default router;
