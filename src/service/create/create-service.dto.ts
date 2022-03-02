import { IsUrl } from 'class-validator';
import { Organisation } from '../../organisation/organisation.entity';

export class CreateServiceDTO {
	name: string;

	description: string;

	namespace: string;

	author: Organisation;

	@IsUrl()
	serviceURL: string;

	@IsUrl()
	introspectionURL: string;
}
