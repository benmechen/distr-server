import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from '../common/base/base.service';
import { ConnectionFilter } from '../common/base/connection.filter';
import { ConnectionSort } from '../common/base/connection.sort';
import { HelperService } from '../common/helper/helper.service';
import { Article } from './article.entity';
import { SearchQuery } from '../common/search.builder';
import { CreateArticleDTO } from './create/create.dto';
import { UpdateArticleDTO } from './update/update.dto';

@Injectable()
export class ArticleService extends BaseService<
	Article,
	CreateArticleDTO,
	UpdateArticleDTO
> {
	constructor(
		@InjectRepository(Article)
		private articleRepository: Repository<Article>,
		helperService: HelperService,
		configService: ConfigService,
	) {
		super(
			ArticleService.name,
			articleRepository,
			helperService,
			configService,
		);
	}

	/**
	 * Search for a article, and return a paginated list
	 * @param take Number of articles to return
	 * @param skip Number of results to skip for pagination
	 * @param query Search query (first & last names)
	 */
	async search(
		take?: number,
		skip?: number,
		sort?: ConnectionSort<Article>,
		filter?: ConnectionFilter,
	) {
		const query = new SearchQuery<Article>(this.articleRepository)
			.order(sort as ConnectionSort<Article>)
			.filter(filter?.fields)
			.search(
				[
					{
						field: 'id',
						type: 'id',
					},
					{
						field: 'title',
					},
					{
						field: 'publisher',
					},
					{
						field: 'teaser',
					},
					{
						field: 'body',
					},
				],
				filter?.query,
			);

		return query.execute(take, skip);
	}
}
