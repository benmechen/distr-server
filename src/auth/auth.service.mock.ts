/* eslint-disable */
export class AuthServiceMock {
	validateUser(): void {}
	createToken(): void {}
	verifyToken(): void {}
	saveToken(): void {}
	revokeToken(): void {}
	isUserLocked(): void {}
	createLinkToken(): void {}
	getTokenExpiration(): void {}
	async resetLoginAttempts(): Promise<void> {}
	async incrementLoginAttempts(): Promise<void> {}
}
/* eslint-enable */
