import { Field, InputType } from '@nestjs/graphql';
import { Platform } from '../../common/platform.enum';

@InputType()
export class ServiceCreateInput {
	@Field({ description: 'Public name of the service' })
	name: string;

	@Field({ description: 'Short summary of the service' })
	summary: string;

	@Field({
		description: 'Full description and details of the service',
	})
	description: string;

	@Field(() => Platform, { description: 'Service platform' })
	platform: Platform;

	// @IsUrl()
	@Field({ description: 'URL of service' })
	serviceURL: string;

	// @IsUrl()
	@Field({ description: 'URL of proto introspection location' })
	introspectionURL: string;

	@Field({
		description: 'Link to relevant documentation for the service',
	})
	documentationURL: string;

	@Field({
		description: 'Link to public source code',
	})
	sourceCodeURL: string;
}
