import { Collection, Entity, OneToMany, Property } from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import { Node } from '../common/base/base.entity';
import { System } from '../system/system.entity';
import { User } from '../user/user.entity';

@Entity()
@ObjectType({ description: 'Organisation model' })
export class Organisation extends Node {
	@Field({ description: "Organisation's name" })
	@Property()
	name: string;

	@OneToMany(() => User, (user) => user.organisation)
	members = new Collection<User>(this);

	@OneToMany(() => System, (system) => system.organisation)
	systems = new Collection<System>(this);
}
