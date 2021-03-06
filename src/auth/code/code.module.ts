import { MikroOrmModule } from '@mikro-orm/nestjs';
import { forwardRef, Module } from '@nestjs/common';
import { TokenModule } from '../../common/token/token.module';
import { UserModule } from '../../user/user.module';
import { Code } from './code.entity';
import { CodeService } from './code.service';
import { RequestResolver } from './request/request.resolver';
import { VerifyResolver } from './verify/verify.resolver';

@Module({
	imports: [
		MikroOrmModule.forFeature([Code]),
		forwardRef(() => UserModule),
		TokenModule,
	],
	providers: [CodeService, RequestResolver, VerifyResolver],
	exports: [CodeService],
})
export class CodeModule {}
