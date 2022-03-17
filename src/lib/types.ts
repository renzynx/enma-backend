import type { Request, Response } from 'express';
import type { Redis } from 'ioredis';
import { Field, ObjectType } from 'type-graphql';

export interface Context {
	req: Request;
	res: Response;
	redis: Redis;
}

export interface PartialGuild {
	id: string;
	name: string;
	icon: string;
	owner: boolean;
	permissions: string;
	features: string[];
	exclude?: boolean;
}

@ObjectType()
export class UserInfo {
	@Field()
	id!: number;

	@Field()
	uid!: string;

	@Field()
	username!: string;

	@Field()
	avatar!: string;
}

@ObjectType()
class GraphqlMutualGuilds {
	@Field()
	id!: string;

	@Field()
	name!: string;

	@Field({ nullable: true })
	icon!: string;

	@Field()
	owner!: boolean;

	@Field()
	permissions!: string;

	@Field(() => [String])
	features!: string[];

	@Field({ nullable: true })
	exclude?: boolean;
}

@ObjectType()
export class MutualGuilds {
	@Field(() => [GraphqlMutualGuilds])
	guilds!: PartialGuild[];
}
