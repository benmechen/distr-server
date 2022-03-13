import { InputType } from '@nestjs/graphql';
import { UserCreateInput } from '../../user/create/create.input';

@InputType()
export class OrganisationMemberAddInput extends UserCreateInput {}
