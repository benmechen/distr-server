import { forwardRef, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CreateResolver } from './create/create.resolver';
import { UpdateResolver } from './update/update.resolver';
import { DeleteResolver } from './delete/delete.resolver';
import { DeploymentResolver } from './deployment.resolver';
import { DeploymentService } from './deployment.service';
import { Deployment } from './deployment.entity';
import { SystemModule } from '../system.module';
import { ResourceModule } from './resource/resource.module';

@Module({
	imports: [
		MikroOrmModule.forFeature([Deployment]),
		forwardRef(() => SystemModule),
		ResourceModule,
	],
	providers: [
		CreateResolver,
		UpdateResolver,
		DeleteResolver,
		DeploymentResolver,
		DeploymentService,
	],
	exports: [DeploymentService],
})
export class DeploymentModule {}
