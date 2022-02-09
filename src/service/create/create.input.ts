import { Field, InputType } from '@nestjs/graphql';
import { IsUrl } from 'class-validator';

@InputType()
export class ServiceCreateInput {
	@Field({ description: 'Public name of the service' })
	name: string;

	@Field()
	description: string;

	@IsUrl()
	@Field({ description: 'URL of service' })
	serviceURL: string;

	@IsUrl()
	@Field({ description: 'URL of proto introspection location' })
	introspectionURL: string;
}
