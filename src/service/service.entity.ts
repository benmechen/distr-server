// eslint-disable-next-line max-classes-per-file
import { Field, ObjectType } from '@nestjs/graphql';
import { Entity, ManyToOne, Property as Column } from '@mikro-orm/core';
import { Node } from '../common/base/base.entity';
import { Paginated } from '../common/base/paginated.entity';
import { Organisation } from '../organisation/organisation.entity';

@Entity()
@ObjectType({ description: 'Service model' })
export class Service extends Node {
	@Field({ description: 'Service name' })
	@Column()
	name: string;

	@Field({ description: 'Service description' })
	@Column()
	description: string;

	@Column()
	namespace: string;

	@ManyToOne(() => Organisation)
	author: Organisation;

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

	@Field({ description: 'Is this service blocked?' })
	@Column({ default: false })
	blocked: boolean;
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
