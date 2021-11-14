/* eslint-disable */
export class UserServiceMock {
	async findByID(): Promise<void> {}
	async findByEmail(): Promise<void> {}
	async findByPhone(): Promise<void> {}
	async findByEmailOrPhone(): Promise<void> {}
	async isPhoneRegistered(): Promise<void> {}
	async isEmailRegistered(): Promise<void> {}
	async create(): Promise<void> {}
	async update(): Promise<void> {}
	async delete(): Promise<void> {}
	async verifyPassword(): Promise<void> {}
	async createToken(): Promise<void> {}
	async activate(): Promise<void> {}
	async getTotalBalance(): Promise<void> {}
	async addToPlayerWatchlist(): Promise<void> {}
	async addToManagerWatchlist(): Promise<void> {}
	async removeManagerFromWatchlist(): Promise<void> {}
	async removePlayerFromWatchlist(): Promise<void> {}
	async setTimeout(): Promise<void> {}
	async removeTimeout(): Promise<void> {}
	async updateBalance(): Promise<void> {}
	async canDeleteUser(): Promise<void> {}
	sendRequestPasswordResetEmail(): void {}
	sendWelcomeEmail(): void {}
	canModifyUser(): void {}
	canUserSetRole(): void {}
}
/* eslint-enable */
