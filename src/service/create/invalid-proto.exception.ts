export class InvalidProto extends Error {
	constructor(reason: string) {
		super(`Invalid Proto File: ${reason}`);
	}
}
