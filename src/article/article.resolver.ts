import { Resolver } from '@nestjs/graphql';
import { UserRole } from '../user/user.entity';
import { BaseResolver } from '../common/base/base.resolver';
import { HelperService } from '../common/helper/helper.service';
import { Article, ArticleConnection } from './article.entity';
import { ArticleService } from './article.service';
import { ArticleCreateInput } from './create/create.input';
import { ArticleUpdateInput } from './update/update.input';
import { CreateArticleDTO } from './create/create.dto';
import { UpdateArticleDTO } from './update/update.dto';

@Resolver()
export class ArticleResolver extends BaseResolver({
	entity: {
		single: Article,
		connection: ArticleConnection as any,
	},
	service: {
		create: CreateArticleDTO,
		update: UpdateArticleDTO,
	},
	resolver: {
		single: { roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF] },
		list: { roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF] },
		many: { roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF] },
		create: {
			ref: ArticleCreateInput,
			roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF],
		},
		update: {
			ref: ArticleUpdateInput,
			roles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF],
		},
	},
}) {
	constructor(articleService: ArticleService, helpersService: HelperService) {
		super(articleService, helpersService);
	}
}
