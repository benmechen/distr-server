// eslint-disable-next-line max-classes-per-file
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Cascade, Entity, Enum, OneToMany, Property } from '@mikro-orm/core';
import { Token } from '../common/token/token.entity';
import { Node } from '../common/base/base.entity';
import { Paginated } from '../common/base/paginated.entity';

export enum UserRole {
	CUSTOMER = 'CUSTOMER',
	STAFF = 'STAFF',
	ADMIN = 'ADMIN',
}
registerEnumType(UserRole, {
	name: 'UserRole',
	description: 'Permissions the user has',
});

export interface IUser {
	firstName?: string;
	lastName?: string;
	email?: string;
	password?: string;
	role?: UserRole;
	issuedTokens?: Token[];
	locked?: boolean;
	loginAttempts?: number;
	timeout?: Date | null;
}

@Entity()
@ObjectType({ description: 'User (customer and staff) model' })
export class User extends Node implements IUser {
	@Field({ description: "User's first name" })
	@Property()
	firstName: string;

	@Field({ description: "User's last name" })
	@Property()
	lastName: string;

	@Field({ description: "User's email address - unique" })
	@Property({ unique: true })
	email: string;

	@Property()
	password: string;

	@Field(() => UserRole, {
		description: "User's role, specifying their access level",
	})
	@Enum(() => UserRole)
	role: UserRole;

	@OneToMany(() => Token, (token) => token.user, {
		cascade: [Cascade.ALL],
	})
	issuedTokens: Token[];

	@Field({
		description: 'Is the account locked',
	})
	@Property()
	locked = false;

	@Field({
		description: 'Is the account activated',
	})
	@Property()
	active = false;

	@Property()
	loginAttempts = 0;

	@Field(() => Date, {
		description: "User's account timeout",
		nullable: true,
	})
	@Property({ nullable: true })
	timeout?: Date | null;

	// One Time Code
	@Property({
		type: 'json',
		nullable: true,
	})
	otc?: {
		code: string;
		timeout: Date;
	};
}

@ObjectType({ description: 'Paginated list of users' })
export class UserConnection extends Paginated(User) {}

// Mock
/* eslint-disable */
export class UserRepositoryMock {
	async findOne(): Promise<void> {}
	async find(): Promise<void> {}
	async findAndCount(): Promise<void> {}
	async save(): Promise<void> {}
	async delete(): Promise<void> {}
	async remove(): Promise<void> {}
	async softRemove(): Promise<void> {}
}
/* eslint-enable */
