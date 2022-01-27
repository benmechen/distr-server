import { Entity, OneToMany, Property } from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import { Node } from '../common/base/base.entity';
import { User } from '../user/user.entity';

@Entity()
@ObjectType({ description: 'Organisation model' })
export class Organisation extends Node {
	@Field({ description: "Organisation's name" })
	@Property()
	name: string;

	@OneToMany(() => User, (user) => user.organisation)
	members: User[];
}
