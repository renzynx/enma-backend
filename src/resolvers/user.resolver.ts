import type { User } from '@prisma/client';
import { Context, MutualGuilds, PartialGuild, UserInfo } from '../lib/types';
import { Ctx, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql';
import { isAuth } from '../middleware/isAuth';
import { getBotGuilds, getUserGuilds } from '../lib/functions';

@Resolver()
export class UserResolver {
	@Query(() => UserInfo)
	@UseMiddleware(isAuth)
	me(@Ctx() { req }: Context): User {
		return req.user as User;
	}

	@Query(() => MutualGuilds, { nullable: true })
	@UseMiddleware(isAuth)
	async guilds(@Ctx() { req }: Context) {
		const [userGuilds, botGuilds] = await Promise.all([getUserGuilds(((await req.user) as User).uid), getBotGuilds()]);

		if (!userGuilds?.length || !botGuilds?.length) return null;

		const included: PartialGuild[] = [];
		const excluded: PartialGuild[] = [];

		const validGuild = userGuilds.filter(({ permissions }) => (parseInt(permissions) & 0x20) === 0x20);

		validGuild.filter((guild) => {
			const includedGuilds = botGuilds.find((g) => g.id === guild.id);
			if (!includedGuilds) return excluded.push(guild);
			return included.push(includedGuilds);
		});

		return { included, excluded };
	}

	@Mutation(() => Boolean)
	@UseMiddleware(isAuth)
	logout(@Ctx() { req }: Context): boolean {
		req.logout();
		return !req.user;
	}
}
