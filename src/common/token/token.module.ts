import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TokenService } from './token.service';
import { AWSHelperService } from './aws.service';
import { Token } from './token.entity';

export const AWSSecretFactory = {
	provide: 'SECRETS',
	useFactory: async (
		awsHelperService: AWSHelperService,
		configService: ConfigService,
	) => {
		return {
			private: await awsHelperService.getSecret(
				configService.get('AWS_PRIVATE_KEY_NAME') ?? '',
			),
			public: await awsHelperService.getSecret(
				configService.get('AWS_PUBLIC_KEY_NAME') ?? '',
			),
		};
	},
	inject: [AWSHelperService, ConfigService],
};

@Module({
	imports: [JwtModule.register({}), MikroOrmModule.forFeature([Token])],
	providers: [TokenService, AWSHelperService, AWSSecretFactory],
	exports: [TokenService],
})
export class TokenModule {}
