import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Article } from './article.entity';
import { ArticleResolver } from './article.resolver';
import { ArticleService } from './article.service';

@Module({
	imports: [MikroOrmModule.forFeature([Article])],
	providers: [ArticleResolver, ArticleService],
})
export class ArticleModule {}
