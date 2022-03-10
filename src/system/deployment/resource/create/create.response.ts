import { Field, ObjectType } from '@nestjs/graphql';
import { Property } from '../property.type';
import { Resource } from '../resource.entity';

@ObjectType()
export class ResourceCreateResponse {
	@Field(() => Resource)
	resource: Resource;

	@Field(() => [Property])
	details: Property[];
}
