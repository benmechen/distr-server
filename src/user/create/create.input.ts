import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, Length } from 'class-validator';
import { User } from '../user.entity';

@InputType({
	description: 'Create a new user',
})
export class UserCreateInput implements Partial<User> {
	@Field({ description: "User's first name. 1-100 characters." })
	@Length(1, 100)
	firstName: string;

	@Field({ description: "User's last name. 1-100 characters." })
	@Length(1, 100)
	lastName: string;

	@Field({
		description: "User's email. Must be in valid email format.",
	})
	@IsEmail()
	email: string;

	@Field({ description: "User's password. Min 8 characters" })
	@Length(8)
	password: string;
}
