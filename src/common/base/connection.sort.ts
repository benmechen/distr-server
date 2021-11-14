import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsAlphanumeric } from 'class-validator';

export enum ConnectionSortOrder {
	ASC = 'ASC',
	DESC = 'DESC',
}
registerEnumType(ConnectionSortOrder, {
	name: 'ConnectionSortOrder',
	description: 'Field sort order',
});

@InputType({
	description: 'Sort a list by a field',
})
export class ConnectionSort<T> {
	@Field(() => String, { description: 'Field to sort by' })
	@IsAlphanumeric()
	field: keyof T;

	@Field(() => ConnectionSortOrder, { description: 'Field sort order' })
	@IsAlphanumeric()
	order: ConnectionSortOrder;
}
