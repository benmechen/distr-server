import { InputType, PartialType } from '@nestjs/graphql';
import { UserCreateInput } from '../create/create.input';

@InputType()
export class UserUpdateInput extends PartialType(UserCreateInput) {}
