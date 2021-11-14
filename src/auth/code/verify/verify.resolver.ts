import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CodeService } from '../code.service';

@Resolver()
export class VerifyResolver {
	constructor(private codeService: CodeService) {}

	@Mutation(() => String)
	async verifyCode(
		@Args({ type: () => String, name: 'code' }) code: string,
	): Promise<string> {
		return this.codeService.verify(code);
	}
}
