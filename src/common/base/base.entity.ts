import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
	CreateDateColumn,
	DeleteDateColumn,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@ObjectType({
	description: 'An object with an ID to support global identification',
})
export abstract class Node {
	@Field(() => ID, { description: 'Globally unique identifier' })
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Field(() => Date, { description: 'Date the object was created' })
	@CreateDateColumn()
	created: Date = new Date();

	@Field(() => Date, { description: 'Date the object was last updated' })
	@UpdateDateColumn()
	updated: Date = new Date();

	@DeleteDateColumn()
	deleted: Date;

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
