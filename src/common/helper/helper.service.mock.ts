/* eslint-disable */
export class HelpersServiceMock {
	getFromConfig(key: string): string {
		return key;
	}
	isValidID(): void {}
	toBase64(): void {}
	fromBase64(): void {}
	inputAddressToDbAddress(): void {}
	calculateAge(): void {}
	queryRunnerFactory(): void {}
	removeAccents(): void {}
	pick(): void {}
	connectionInputToFilters() {
		return {
			order: {},
			filters: {},
		};
	}
}
/* eslint-enable */
