import { InputType, PartialType } from '@nestjs/graphql';
import { ArticleCreateInput } from '../create/create.input';

@InputType()
export class ArticleUpdateInput extends PartialType(ArticleCreateInput) {}
