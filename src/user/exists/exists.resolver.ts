import { Args, Query, Resolver } from '@nestjs/graphql';
import { UserService } from '../user.service';
import { UserExistsResponse } from './exists.type';

@Resolver()
export class ExistsResolver {
	constructor(private readonly userService: UserService) {}

	@Query(() => UserExistsResponse)
	async userRegistered(
		@Args('email') email: string,
	): Promise<UserExistsResponse> {
		const user = await this.userService.findByEmail(email);
		if (!user) return { exists: false };

		return {
			exists: true,
			name: user.firstName,
		};
	}
}
