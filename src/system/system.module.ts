import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { System } from './system.entity';
import { SystemService } from './system.service';
import { CreateResolver } from './create/create.resolver';
import { UpdateResolver } from './update/update.resolver';
import { DeleteResolver } from './delete/delete.resolver';
import { OrganisationModule } from '../organisation/organisation.module';
import { SystemResolver } from './system.resolver';

@Module({
	imports: [MikroOrmModule.forFeature([System]), OrganisationModule],
	providers: [
		SystemService,
		CreateResolver,
		UpdateResolver,
		DeleteResolver,
		SystemResolver,
	],
	exports: [SystemService],
})
export class SystemModule {}
