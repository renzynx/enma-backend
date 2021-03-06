import 'reflect-metadata';
import './lib/strategy';
import { config } from 'dotenv';
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import connectRedis from 'connect-redis';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import http from 'http';
import Redis from 'ioredis';
import passport from 'passport';
import { buildSchema } from 'type-graphql';
import { PORT } from './lib/constants';
import logger from './lib/logger';
import { UserResolver } from './resolvers/user.resolver';
import login from './routes/login';

config();

const bootstrap = async () => {
	try {
		logger.info(`Starting server in ${process.env.NODE_ENV} mode`);
		const redisClient = new Redis(process.env.REDIS_URL!, { keepAlive: 5000 });
		const redisStore = connectRedis(session);

		const app = express();
		const httpServer = http.createServer(app);

		app.set('trust proxy', 1);
		app.use(
			cors({
				credentials: true,
				origin: process.env.NODE_ENV === 'production' ? 'https://beta.renzynx.space' : 'http://localhost:3000'
			})
		);
		app.use(
			session({
				secret: 'keyboard cat',
				resave: false,
				saveUninitialized: false,
				name: 'qid',
				cookie: {
					maxAge: 1000 * 60 * 60 * 24 * 7,
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					domain: process.env.NODE_ENV === 'production' ? '.renzynx.space' : undefined
				},
				store: new redisStore({ client: redisClient })
			})
		);
		app.use(passport.initialize());
		app.use(passport.session());
		app.use('/login', login);

		const server = new ApolloServer({
			schema: await buildSchema({
				resolvers: [UserResolver],
				validate: false
			}),
			context: ({ req, res }) => ({ req, res, redis: redisClient }),
			plugins: [ApolloServerPluginLandingPageGraphQLPlayground(), ApolloServerPluginDrainHttpServer({ httpServer })]
		});
		await server.start();
		server.applyMiddleware({ app, cors: false });
		app.listen(PORT);
		logger.success(`[bootstrap] Server is listening on address http://localhost:${PORT}`);
		logger.success(`[bootstrap] GraphQL Playground is available at http://localhost:${PORT}/graphql`);
	} catch (error: any) {
		logger.error(error.message);
	}
};

bootstrap().catch((err) => {
	logger.error(`[bootstrap] ${err.message}`);
	process.exit(1);
});
