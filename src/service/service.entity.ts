// eslint-disable-next-line max-classes-per-file
import { Field, ObjectType } from '@nestjs/graphql';
import {
	Entity,
	Enum,
	IdentifiedReference,
	ManyToOne,
	OptionalProps,
	Property as Column,
} from '@mikro-orm/core';
import { Node } from '../common/base/base.entity';
import { Paginated } from '../common/base/paginated.entity';
import { Organisation } from '../organisation/organisation.entity';
import { Platform } from '../common/platform.enum';

@Entity()
@ObjectType({ description: 'Service model' })
export class Service extends Node {
	@Field({ description: 'Service name' })
	@Column()
	name: string;

	@Field({ description: 'Brief summary of the service' })
	@Column()
	summary: string;

	@Field({ description: 'Service description' })
	@Column({
		columnType: 'text',
		length: 65535,
	})
	description: string;

	@Field(() => Platform, { description: 'Platform the service operates on' })
	@Enum(() => Platform)
	platform: Platform = Platform.Other;

	@Field(() => Boolean, { description: 'Is the service verified by Distr?' })
	@Column({
		columnType: 'boolean',
	})
	verified = false;

	@Column()
	namespace: string;

	@ManyToOne(() => Organisation, { wrappedReference: true })
	author: IdentifiedReference<Organisation>;

	@Field({
		description:
			'Location at which the service is hosted and gRPC messages can be sent',
	})
	@Column()
	serviceURL: string;

	@Field({
		description:
			"Location at which the service's proto specification can be requested",
	})
	@Column()
	introspectionURL: string;

	@Field({
		description: 'Link to relevant documentation for the service',
	})
	@Column()
	documentationURL: string;

	@Field({
		description: 'Link to public source code',
	})
	@Column()
	sourceCodeURL: string;

	@Field({ description: 'Is this service blocked?' })
	@Column({ default: false })
	blocked: boolean;

	override [OptionalProps]?: 'created' | 'updated' | 'blocked' | 'verified';
}

@ObjectType({ description: 'Paginated list of services' })
export class ServiceConnection extends Paginated(Service) {}

// Mock
/* eslint-disable */
export class ServiceRepositoryMock {
	async findOne(): Promise<void> {}
	async find(): Promise<void> {}
	async findAndCount(): Promise<void> {}
	async save(): Promise<void> {}
	async delete(): Promise<void> {}
	async remove(): Promise<void> {}
	async softRemove(): Promise<void> {}
}
/* eslint-enable */
