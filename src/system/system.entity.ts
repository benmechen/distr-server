import {
	Entity,
	IdentifiedReference,
	ManyToOne,
	Property,
} from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import { Node } from '../common/base/base.entity';
import { Paginated } from '../common/base/paginated.entity';
import { Organisation } from '../organisation/organisation.entity';

@Entity()
@ObjectType({ description: 'System model' })
export class System extends Node {
	@Field({ description: 'System name' })
	@Property()
	name: string;

	@Field(() => Organisation)
	@ManyToOne(() => Organisation, { wrappedReference: true })
	organisation: IdentifiedReference<Organisation>;
}

@ObjectType({ description: 'Paginated list of systems' })
export class SystemConnection extends Paginated(System) {}
