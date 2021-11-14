import { Field, InputType } from '@nestjs/graphql';
import { IsAlphanumeric } from 'class-validator';

@InputType({
	description:
		'Field and value pair. Field must be a property on the entity.',
})
export class ConnectionFieldFilter {
	@Field({ description: 'Field name' })
	@IsAlphanumeric()
	field: string;

	@Field(() => [String], { description: 'Field value to match' })
	@IsAlphanumeric()
	value: string[];
}

@InputType({
	description: 'Filter a list by a query',
})
export class ConnectionFilter {
	@Field({ nullable: true, description: 'Simple text search' })
	query?: string;

	@Field(() => [ConnectionFieldFilter], {
		nullable: true,
		description: 'Collection of fields to filter by',
	})
	fields?: ConnectionFieldFilter[];
}
