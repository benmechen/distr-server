/* eslint-disable */
import { Resolver } from '@nestjs/graphql';

@Resolver()
export class ForgotResolver {
	constructor() {} // private notificationService: NotificationService, // private configService: ConfigService, // private authService: AuthService, // private userService: UserService, // private codeService: CodeService,

	// @Mutation(() => Tokens)
	// async resetPassword(
	// 	@Args() { password, verification, phone }: ForgotArgs,
	// 	@Context() context: APIContext,
	// ): Promise<Tokens> {
	// 	if (!this.codeService.isVerificationValid(verification, phone))
	// 		throw new APIError(APIErrorCode.CODE_INCORRECT);

	// 	let user = await this.userService.findByPhone(phone);
	// 	if (!user) throw new APIError(APIErrorCode.NOT_FOUND, 'user');

	// 	// Update password
	// 	user = await this.userService.update(user, {
	// 		password,
	// 	});

	// 	this.notificationService.send(
	// 		new PasswordResetNotification(user, new Date()),
	// 	);

	// 	user = await this.authService.resetLoginAttempts(user);

	// 	// Create JWT tokens
	// 	const accessToken = await this.authService.createToken(user, 'access');
	// 	const refreshToken = await this.authService.createToken(
	// 		user,
	// 		'refresh',
	// 	);

	// 	context.res?.cookie(
	// 		this.configService.get('REFRESH_TOKEN_COOKIE') ?? 'refreshToken',
	// 		refreshToken,
	// 		{
	// 			expires: this.authService.getTokenExpiration().refreshToken,
	// 			httpOnly: true,
	// 			sameSite: 'strict',
	// 		},
	// 	);

	// 	// Add refresh token to whitelist
	// 	await this.authService.saveToken(user, refreshToken);

	// 	return {
	// 		accessToken,
	// 		accessTokenExpiration:
	// 			this.authService.getTokenExpiration().accessToken,
	// 		refreshToken,
	// 		role: user.role,
	// 	};
	// }
}
