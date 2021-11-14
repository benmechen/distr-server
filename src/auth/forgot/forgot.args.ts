import { ArgsType, Field } from '@nestjs/graphql';
import { IsJWT, IsMobilePhone, MinLength } from 'class-validator';

@ArgsType()
export class ForgotArgs {
	@Field({ description: 'New password' })
	@MinLength(8)
	password: string;

	@Field({ description: 'Phone used to request verification' })
	@IsMobilePhone('en-GB')
	phone: string;

	@Field({ description: 'Token received from OTC verification' })
	@IsJWT()
	verification: string;
}
