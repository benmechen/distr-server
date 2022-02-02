import {
	Entity,
	IdentifiedReference,
	ManyToOne,
	Property,
} from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import { Node } from '../../../common/base/base.entity';
import { Paginated } from '../../../common/base/paginated.entity';
import { Deployment } from '../deployment.entity';

@Entity()
@ObjectType({ description: 'Single resource in a deployment' })
export class Resource extends Node {
	@Field({ description: 'Resource name' })
	@Property()
	name: string;

	@ManyToOne(() => Deployment, { wrappedReference: true })
	deployment: IdentifiedReference<Deployment>;
}

@ObjectType({ description: 'Paginated list of resources' })
export class ResourceConnection extends Paginated(Resource) {}
