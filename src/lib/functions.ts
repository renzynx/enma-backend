import axios from 'axios';
import crypto from 'crypto';
import { DISCORD_API_BASE } from './constants';
import logger from './logger';
import prisma from './prisma';
import type { PartialGuild } from './types';

const encrypt = (plainText: string) => {
	const iv = crypto.randomBytes(16);
	const key = crypto.createHash('sha256').update(process.env.TOKEN!).digest('base64').substring(0, 32);
	const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
	let encrypted = cipher.update(plainText);
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (encryptedText: string) => {
	const textParts = encryptedText.split(':');
	const iv = Buffer.from(textParts.shift()!, 'hex');
	const encryptedData = Buffer.from(textParts.join(':'), 'hex');
	const key = crypto.createHash('sha256').update(process.env.TOKEN!).digest('base64').substring(0, 32);
	const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

	const decrypted = decipher.update(encryptedData);
	const decryptedText = Buffer.concat([decrypted, decipher.final()]);
	return decryptedText.toString();
};

const getBotGuilds = async () => {
	const res = await axios.get<PartialGuild[]>(`${DISCORD_API_BASE}/users/@me/guilds`, {
		headers: {
			Authorization: `Bot ${process.env.BOT_TOKEN}`
		}
	});
	return res.data;
};

const getUserGuilds = async (id: string): Promise<PartialGuild[] | null> => {
	try {
		const userToken = await prisma.oAuth.findUnique({ where: { uid: id } });
		const res = await axios.get<PartialGuild[]>(`${DISCORD_API_BASE}/users/@me/guilds`, {
			headers: {
				Authorization: `Bearer ${decrypt(userToken?.access_token!)}`
			}
		});
		return res.data;
	} catch (error: any) {
		if (error.response.status == 401) {
			await prisma.oAuth.update({ where: { uid: id }, data: { access_token: '', refresh_token: '' } });
			return null;
		}
		logger.error(`Error getting user guilds: ${error.message}`);
		return null;
	}
};

export { encrypt, decrypt, getBotGuilds, getUserGuilds };
