export class ConfigException extends Error {
	constructor(key: string) {
		super(`Value for environment variable ${key} not given`);
	}
}
