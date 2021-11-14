import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, ValidateIf } from 'class-validator';
import { UserCreateInput } from '../create/create.input';

@InputType()
export class UserUpdateInput extends PartialType(UserCreateInput) {
	@Field({
		description:
			"User's current password - required to update sensitive fields (email, password)",
		nullable: true,
	})
	// Only require the current password if the email or password have also been given
	@ValidateIf((input) => input.email || input.password)
	@IsNotEmpty({
		message:
			'Your current password is required to update your email and/or password',
	})
	currentPassword?: string;
}
