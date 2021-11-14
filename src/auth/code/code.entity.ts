import { Column, Entity } from 'typeorm';
import { Node } from '../../common/base/base.entity';

@Entity('codes')
export class Code extends Node {
	@Column({
		unique: true,
	})
	code: string;

	@Column()
	identifier: string;
}

// Mock
/* eslint-disable */
export class CodeRepositoryMock {
	async find(): Promise<void> {}
	async delete(): Promise<void> {}
}
/* eslint-enable */
