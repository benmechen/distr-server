import { IsUrl } from 'class-validator';

export class CreateServiceDTO {
	name: string;

	description: string;

	namespace: string;

	@IsUrl()
	serviceURL: string;

	@IsUrl()
	introspectionURL: string;
}
