import { InputType, PartialType } from '@nestjs/graphql';
import { ResourceCreateInput } from '../create/create.input';

@InputType()
export class ResourceUpdateInput extends PartialType(ResourceCreateInput) {}
