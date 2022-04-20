import { BaseServiceMock } from '../common/base/base.service.mock';

/* eslint-disable */
export class OrganisationServiceMock extends BaseServiceMock {
	async createDefault(): Promise<void> {}
	async addMember(): Promise<void> {}
}
