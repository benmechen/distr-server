import { InputType, PartialType } from '@nestjs/graphql';
import { SystemCreateInput } from '../create/create.input';

@InputType()
export class SystemUpdateInput extends PartialType(SystemCreateInput) {}
