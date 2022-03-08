import type { MiddlewareFn } from 'type-graphql';
import type { Context } from '../lib/types';

export const isAuth: MiddlewareFn<Context> = ({ context }, next) => {
	if (!context.req.user) throw new Error('not authenticated');
	return next();
};
