import type { User } from '@prisma/client';
import passport from 'passport';
import refresh from 'passport-oauth2-refresh';
import prisma from './prisma';
import logger from './logger';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { encrypt } from './functions';

passport.serializeUser((user, done) => {
	const discordUser = user as User;
	return done(null, discordUser.uid);
});

passport.deserializeUser((id: string, done) => {
	try {
		const user = prisma.user.findUnique({ where: { uid: id } });
		return user ? done(null, user) : done(null, null);
	} catch (error: any) {
		logger.error(`[passport] ${error.message}`);
		return done(error, null);
	}
});

const strat = new DiscordStrategy(
	{
		clientID: '776094191095775294',
		clientSecret: '-nqsMejqCYPW0VPkXfBBl0-yKn5mevOs',
		callbackURL: 'http://localhost:42069/login/callback',
		scope: ['identify', 'guilds']
	},
	async (accessToken, refreshToken, profile, done) => {
		try {
			const [user, oauth, access_token, refresh_token] = await Promise.all([
				prisma.user.findUnique({ where: { uid: profile.id } }),
				prisma.oAuth.findUnique({ where: { uid: profile.id } }),
				encrypt(accessToken),
				encrypt(refreshToken)
			]);

			if (user) {
				if (!oauth) {
					await prisma.oAuth.create({
						data: {
							uid: profile.id,
							access_token,
							refresh_token
						}
					});
				}
				return done(null, user);
			}

			const [newUser] = await Promise.all([
				prisma.user.create({
					data: {
						uid: profile.id,
						username: profile.username,
						avatar: profile.avatar
					}
				}),
				prisma.oAuth.create({
					data: {
						uid: profile.id,
						access_token,
						refresh_token
					}
				})
			]);

			return done(null, newUser);
		} catch (error: any) {
			logger.error(`[passport] ${error.message}`);
			return done(error, undefined);
		}
	}
);

passport.use(strat);
refresh.use(strat);
