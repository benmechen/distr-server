import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from './user.entity';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { UserCreateResolver } from './create/create.resolver';
import { UserUpdateResolver } from './update/update.resolver';
import { UserDeleteResolver } from './delete/delete.resolver';
import { AuthModule } from '../auth/auth.module';
import { UserTimeoutResolver } from './timeout/timeout.resolver';
import { CodeModule } from '../auth/code/code.module';
import { OrganisationModule } from '../organisation/organisation.module';

@Module({
	imports: [
		MikroOrmModule.forFeature([User]),
		HttpModule,
		forwardRef(() => AuthModule),
		CodeModule,
		OrganisationModule,
	],
	providers: [
		UserResolver,
		UserService,
		UserTimeoutResolver,
		UserCreateResolver,
		UserUpdateResolver,
		UserDeleteResolver,
	],
	exports: [UserResolver, UserService],
})
export class UserModule {}
