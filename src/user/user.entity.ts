// eslint-disable-next-line max-classes-per-file
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { BeforeInsert, Column, Entity, OneToMany } from 'typeorm';
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

@ObjectType({ description: "User's terms of service" })
export class TermsOfService {
	@Field(() => String, {
		description: 'IP of the user when the terms of service was agreed',
	})
	ip: string;

	@Field(() => String, {
		description: 'IP of the user when the terms of service was agreed',
	})
	agent: string;

	@Field(() => String, {
		description: 'Date of when the user agreed to terms of service',
	})
	date: Date;
}

export interface IUser {
	firstName?: string;
	lastName?: string;
	email?: string;
	password?: string;
	phone?: string;
	role?: UserRole;
	issuedTokens?: Token[];
	locked?: boolean;
	loginAttempts?: number;
	timeout?: Date | null;
	tos?: TermsOfService | boolean;
}

@Entity('users')
@ObjectType({ description: 'User (customer and staff) model' })
export class User extends Node implements IUser {
	@Field({ description: "User's first name" })
	@Column()
	firstName: string;

	@Field({ description: "User's last name" })
	@Column()
	lastName: string;

	@BeforeInsert()
	formatNameEmail?() {
		this.email = this.email.toLowerCase();
		this.firstName =
			this.firstName.charAt(0) + this.firstName.slice(1).toLowerCase();
		this.lastName =
			this.lastName.charAt(0) + this.lastName.slice(1).toLowerCase();
	}

	@Field({ description: "User's email address - unique" })
	@Column('text', { unique: true })
	email: string;

	@Column()
	password: string;

	@Field(() => UserRole, {
		description: "User's role, specifying their access level",
	})
	@Column({
		type: 'enum',
		enum: UserRole,
		default: UserRole.CUSTOMER,
	})
	role: UserRole;

	@Field({
		description: "User's phone. Must be in valid UK mobile format.",
	})
	@Column({
		unique: true,
	})
	phone: string;

	@OneToMany(() => Token, (token) => token.user, {
		cascade: true,
	})
	issuedTokens: Token[];

	@Field({
		description: 'Is the account locked',
	})
	@Column({ type: 'boolean', default: false })
	locked: boolean;

	@Field({
		description: 'Is the account activated',
	})
	@Column({ type: 'boolean', default: false })
	active: boolean;

	@Column({ default: 0 })
	loginAttempts: number;

	@Field(() => Date, {
		description: "User's account timeout",
		nullable: true,
	})
	@Column('timestamp without time zone', { nullable: true })
	timeout?: Date | null;

	@Field(() => TermsOfService, {
		description: "User's terms of service agreement",
	})
	@Column({ type: 'json', default: null })
	tos: TermsOfService | boolean;

	// One Time Code
	@Column('json', { nullable: true })
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
