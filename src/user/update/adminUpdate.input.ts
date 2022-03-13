import { Field, InputType } from '@nestjs/graphql';
import { UserRole } from '../user.entity';
import { UserUpdateInput } from './update.input';

@InputType()
export class AdminUserUpdateInput extends UserUpdateInput {
	@Field({ description: 'User access role', nullable: true })
	role?: UserRole;

	@Field({ description: "Is the user's account locked", nullable: true })
	locked?: boolean;

	@Field({ description: "User's account timeout", nullable: true })
	timeout?: Date;
}
