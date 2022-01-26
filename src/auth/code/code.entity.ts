import { Entity, Property } from '@mikro-orm/core';
import { Node } from '../../common/base/base.entity';

@Entity({})
export class Code extends Node {
	constructor(code: string, identitfier: string) {
		super();
		this.code = code;
		this.identifier = identitfier;
	}

	@Property({
		unique: true,
	})
	code: string;

	@Property()
	identifier: string;
}

// Mock
/* eslint-disable */
export class CodeRepositoryMock {
	async find(): Promise<void> {}
	async delete(): Promise<void> {}
}
/* eslint-enable */
