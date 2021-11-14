import { ArgsType, Field } from '@nestjs/graphql';
import { IsMobilePhone } from 'class-validator';

@ArgsType()
export class RequestCodeArgs {
	@Field({ description: 'Mobile number' })
	@IsMobilePhone('en-GB')
	phone: string;
}
