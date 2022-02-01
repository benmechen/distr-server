import {
	Collection,
	Entity,
	IdentifiedReference,
	ManyToOne,
	Property,
} from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import { OneToMany } from 'typeorm';
import { Node } from '../common/base/base.entity';
import { Paginated } from '../common/base/paginated.entity';
import { Organisation } from '../organisation/organisation.entity';
import { Deployment } from './deployment/deployment.entity';

@Entity()
@ObjectType({ description: 'System model' })
export class System extends Node {
	@Field({ description: 'System name' })
	@Property()
	name: string;

	@Field(() => Organisation)
	@ManyToOne(() => Organisation, { wrappedReference: true })
	organisation: IdentifiedReference<Organisation>;

	@OneToMany(() => Deployment, (deployment) => deployment.system)
	deployments: Collection<Deployment>;
}

@ObjectType({ description: 'Paginated list of systems' })
export class SystemConnection extends Paginated(System) {}
