import { InputType, Field, OmitType } from '@nestjs/graphql';
import { UserRole } from '../user.entity';
import { UserCreateInput } from './create.input';

@InputType({
	description: 'Create a new user',
})
export class AdminUserCreateInput extends OmitType(UserCreateInput, [
	'verification',
] as const) {
	@Field({ description: 'User access role' })
	role: UserRole;
}
