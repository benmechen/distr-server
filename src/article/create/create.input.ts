import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsUrl } from 'class-validator';
import { Article } from '../article.entity';

@InputType({
	description: 'Create a new news article',
})
export class ArticleCreateInput implements Partial<Article> {
	@Field({ description: "Article's. Must not be empty." })
	@IsNotEmpty()
	title: string;

	@Field({ description: "Article's. Must not be empty." })
	@IsNotEmpty()
	publisher: string;

	@Field({
		description:
			'URL to JPG or PNG image for the article header. Must be a URL.',
	})
	@IsUrl()
	image: string;

	@Field({
		description:
			'Article subtext. Short summary of the article. Must not be empty',
	})
	@IsNotEmpty()
	teaser: string;

	@Field({
		description:
			'Article body. Main article content. HTML or plaintext. Must not be empty',
	})
	@IsNotEmpty()
	body: string;
}
