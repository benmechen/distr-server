import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsPositive } from 'class-validator';
import { ConnectionFilter } from './connection.filter';
import { ConnectionSort } from './connection.sort';

@ArgsType()
export class ConnectionArgs<S> {
	@Field(() => Int, {
		description: 'Number of items to select',
	})
	@IsPositive()
	limit: number;

	@Field(() => Int, {
		nullable: true,
		description: 'Page to select',
		defaultValue: 1,
	})
	@IsOptional()
	page?: number = 1;

	@Field({
		nullable: true,
		description: 'Filter the list',
	})
	filter?: ConnectionFilter;

	@Field({ nullable: true, description: 'Sort connection by fields' })
	sort?: ConnectionSort<S>;
}
