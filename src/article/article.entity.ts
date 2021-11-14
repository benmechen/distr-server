import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity } from 'typeorm';
import { Node } from '../common/base/base.entity';
import { Paginated } from '../common/base/paginated.entity';

@Entity('articles')
@ObjectType({ description: 'Article model' })
export class Article extends Node {
	@Column({ unique: true, nullable: true })
	optaId: string;

	@Field({ description: 'Article title' })
	@Column()
	title: string;

	@Field({ description: 'Article title' })
	@Column({ default: '${project-name}' })
	publisher: string;

	@Field({ description: "URL of article's header image", nullable: true })
	@Column()
	image: string;

	@Field({ description: 'Short article description' })
	@Column()
	teaser: string;

	@Field({ description: 'Article body text' })
	@Column()
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
