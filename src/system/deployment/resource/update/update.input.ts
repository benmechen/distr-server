import { InputType, OmitType, PartialType } from '@nestjs/graphql';
import { ResourceCreateInput } from '../create/create.input';

@InputType()
export class ResourceUpdateInput extends PartialType(
	OmitType(ResourceCreateInput, ['serviceID'] as const),
) {}
