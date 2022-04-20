import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { User } from '../../user/user.entity';
import { Node } from '../base/base.entity';

@Entity()
export class Token extends Node {
	@Property()
	token: string;

	@ManyToOne(() => User)
	user: User;
}

// Mock
/* eslint-disable */
export class TokenRepositoryMock {
	async find(): Promise<void> {}
	async delete(): Promise<void> {}
	async removeAndFlush(): Promise<void> {}
}
/* eslint-enable */
