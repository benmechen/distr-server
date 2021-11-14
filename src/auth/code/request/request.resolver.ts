import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UserService } from '../../../user/user.service';
import { CodeService } from '../code.service';
import { RequestCodeArgs } from './request.args';

@Resolver()
export class RequestResolver {
	constructor(
		private codeService: CodeService,
		private userService: UserService,
	) {}

	@Mutation(() => Boolean)
	async requestCode(@Args() { phone }: RequestCodeArgs): Promise<boolean> {
		const formattedPhone = this.userService.formatPhoneNumber(phone);

		if (!formattedPhone) return false;

		return this.codeService.generate(formattedPhone);
	}
}
