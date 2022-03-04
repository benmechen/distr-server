import { IsUrl } from 'class-validator';
import { Platform } from '../../common/platform.enum';
import { Organisation } from '../../organisation/organisation.entity';

export class CreateServiceDTO {
	name: string;

	summary: string;

	description: string;

	namespace: string;

	author: Organisation;

	platform: Platform;

	@IsUrl()
	serviceURL: string;

	@IsUrl()
	introspectionURL: string;

	@IsUrl()
	documentationURL: string;

	@IsUrl()
	sourceCodeURL: string;
}
