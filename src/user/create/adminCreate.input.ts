import { InputType, Field } from '@nestjs/graphql';
import { UserRole } from '../user.entity';
import { UserCreateInput } from './create.input';

@InputType({
	description: 'Create a new user',
})
export class AdminUserCreateInput extends UserCreateInput {
	@Field({ description: 'User access role' })
	role: UserRole;
}
