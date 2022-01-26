import { Entity, Property } from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import { Node } from '../common/base/base.entity';
import { Paginated } from '../common/base/paginated.entity';

@Entity()
@ObjectType({ description: 'Article model' })
export class Article extends Node {
	@Field({ description: 'Article title' })
	@Property()
	title: string;

	@Field(() => String, { description: 'Article title' })
	@Property({ type: 'string' })
	publisher = 'distr';

	@Field({ description: "URL of article's header image", nullable: true })
	@Property()
	image: string;

	@Field({ description: 'Short article description' })
	@Property()
	teaser: string;

	@Field({ description: 'Article body text' })
	@Property()
	body: string;
}

@ObjectType({ description: 'Paginated list of articles' })
export class ArticleConnection extends Paginated(Article) {}

/* eslint-disable */
export class ArticleRepositoryMock {
	async findOne(): Promise<void> {}
	async find(): Promise<void> {}
	async findAndCount(): Promise<void> {}
	async save(): Promise<void> {}
	async delete(): Promise<void> {}
	async remove(): Promise<void> {}
}
/* eslint-enable */
