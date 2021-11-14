import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

@ObjectType({
	description: 'Information about pagination in a connection',
})
export class PageInfo {
	@Field(() => Int, {
		description: 'Total number of items in the collection',
	})
	total: number;

	@Field({
		description: 'Are there more pages after this one?',
	})
	hasNextPage: boolean;
}

export function Paginated<T>(classRef: Type<T>): any {
	@ObjectType(`${classRef.name}Edge`)
	abstract class EdgeType {
		@Field(() => String)
		cursor: string;

		@Field(() => classRef)
		node: T;
	}

	@ObjectType({ isAbstract: true })
	abstract class PaginatedType {
		@Field(() => [EdgeType], { nullable: true })
		edges: EdgeType[];

		// @Field((type) => [classRef], { nullable: true })
		// nodes: T[]

		@Field(() => PageInfo, { description: 'Pagination details' })
		pageInfo: PageInfo;
	}
	return PaginatedType;
}
