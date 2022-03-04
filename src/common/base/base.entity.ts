import { OptionalProps, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { v4 } from 'uuid';

@ObjectType({
	description: 'An object with an ID to support global identification',
})
export abstract class Node {
	@Field(() => ID, { description: 'Globally unique identifier' })
	@PrimaryKey()
	id: string = v4();

	@Field(() => Date, { description: 'Date the object was created' })
	@Property()
	created: Date = new Date();

	@Field(() => Date, { description: 'Date the object was last updated' })
	@Property({ onUpdate: () => new Date() })
	updated: Date = new Date();

	[OptionalProps]?: 'created' | 'updated' | string;

	/**
	 * Create a new entity
	 * @param params entity input
	 */
	public static of<T extends Node>(this: new () => T, params: Partial<T>): T {
		const entity = new this();

		Object.assign(entity, params);

		return entity;
	}
}
