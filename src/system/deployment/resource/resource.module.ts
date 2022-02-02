import { MikroOrmModule } from '@mikro-orm/nestjs';
import { forwardRef, Module } from '@nestjs/common';
import { Resource } from './resource.entity';
import { CreateResolver } from './create/create.resolver';
import { UpdateResolver } from './update/update.resolver';
import { DeleteResolver } from './delete/delete.resolver';
import { ResourceService } from './resource.service';
import { DeploymentModule } from '../deployment.module';
import { ResourceResolver } from './resource.resolver';

@Module({
	imports: [
		MikroOrmModule.forFeature([Resource]),
		forwardRef(() => DeploymentModule),
	],
	providers: [
		CreateResolver,
		UpdateResolver,
		DeleteResolver,
		ResourceService,
		ResourceResolver,
	],
	exports: [ResourceService],
})
export class ResourceModule {}
