import { CacheModule, forwardRef, HttpModule, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { LoginResolver } from './login/login.resolver';
import { RefreshResolver } from './refresh/refresh.resolver';
import { JWTStrategy } from './jwt.strategy';
import { LogoutResolver } from './logout/logout.resolver';
import { TokenModule } from '../common/token/token.module';
import { CodeModule } from './code/code.module';
import { ForgotResolver } from './forgot/forgot.resolver';

@Module({
	imports: [
		TokenModule,
		forwardRef(() => UserModule),
		PassportModule,
		HttpModule,
		CacheModule.register({
			store: redisStore,
			host: process.env.REDIS_HOST ?? 'localhost',
			port: process.env.REDIS_PORT ?? 6379,
		}),
		CodeModule,
	],
	providers: [
		AuthService,
		LoginResolver,
		RefreshResolver,
		JWTStrategy,
		LogoutResolver,
		ForgotResolver,
	],
	exports: [AuthService],
})
export class AuthModule {}
