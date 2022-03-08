import { blueBright, yellowBright, redBright, greenBright, cyanBright } from 'colorette';

enum Icon {
	SUCCESS = '✔',
	FATAL = 'X',
	WARN = '⚠',
	INFO = 'ℹ️'
}

const time = ` ${new Date().toLocaleTimeString()} `;

const info = (...args: unknown[]) => process.stdout.write(`${Icon.INFO} ${cyanBright(`[${time}]`)} ${blueBright(args.join(' ').toString())}\n`);
const warn = (...args: unknown[]) => process.stdout.write(`${Icon.WARN} ${cyanBright(`[${time}]`)} ${yellowBright(args.join(' ').toString())}\n`);
const error = (...args: unknown[]) => process.stdout.write(`${Icon.FATAL} ${cyanBright(`[${time}]`)} ${redBright(args.join(' ').toString())}\n`);
const success = (...args: unknown[]) =>
	process.stdout.write(` ${Icon.SUCCESS} ${cyanBright(`[${time}]`)} ${greenBright(args.join(' ').toString())}\n`);

const logger = () => ({
	info,
	warn,
	error,
	success
});

export default logger();
