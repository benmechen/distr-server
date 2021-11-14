import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from '../../user/user.entity';
import { Node } from '../base/base.entity';

@Entity('tokens')
export class Token extends Node {
	@Column()
	token: string;

	@ManyToOne(() => User, (user) => user.issuedTokens, {
		onDelete: 'CASCADE',
	})
	user: User;
}

// Mock
/* eslint-disable */
export class TokenRepositoryMock {
	async find(): Promise<void> {}
	async delete(): Promise<void> {}
}
/* eslint-enable */
