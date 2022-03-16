import axios from 'axios';
import crypto from 'crypto';
import refresh from 'passport-oauth2-refresh';
import { DISCORD_API_BASE } from './constants';
import logger from './logger';
import prisma from './prisma';
import type { PartialGuild } from './types';

const encrypt = (plainText: string) => {
	try {
		const iv = crypto.randomBytes(16);
		const key = crypto.createHash('sha256').update(process.env.TOKEN!).digest('base64').substring(0, 32);
		const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
		let encrypted = cipher.update(plainText);
		encrypted = Buffer.concat([encrypted, cipher.final()]);
		return iv.toString('hex') + ':' + encrypted.toString('hex');
	} catch (error: any) {
		throw new Error(error.message);
	}
};

const decrypt = (encryptedText: string) => {
	try {
		const textParts = encryptedText.split(':');
		const iv = Buffer.from(textParts.shift()!, 'hex');
		const encryptedData = Buffer.from(textParts.join(':'), 'hex');
		const key = crypto.createHash('sha256').update(process.env.TOKEN!).digest('base64').substring(0, 32);
		const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

		const decrypted = decipher.update(encryptedData);
		const decryptedText = Buffer.concat([decrypted, decipher.final()]);
		return decryptedText.toString();
	} catch (error: any) {
		throw new Error(error.message);
	}
};

const getBotGuilds = async () => {
	const res = await axios.get<PartialGuild[]>(`${DISCORD_API_BASE}/users/@me/guilds`, {
		headers: {
			Authorization: `Bot ${process.env.BOT_TOKEN}`
		}
	});
	return res.data;
};

const getUserGuilds = async (id: string): Promise<PartialGuild[]> => {
	const userToken = await prisma.oAuth.findUnique({ where: { uid: id } });

	const res = await axios.get<PartialGuild[]>(`${DISCORD_API_BASE}/users/@me/guilds`, {
		headers: {
			Authorization: `Bearer ${decrypt(userToken?.access_token!)}`
		}
	});

	if (res.status === 401) {
		return refresh.requestNewAccessToken('discord', userToken?.refresh_token!, async (error, accessToken, refreshToken) => {
			logger.info(error);
			await prisma.oAuth.update({
				where: { uid: id },
				data: { access_token: encrypt(accessToken), refresh_token: encrypt(refreshToken) }
			});
			return await getUserGuilds(id);
		});
	}

	return res.data;
};

export { encrypt, decrypt, getBotGuilds, getUserGuilds };
