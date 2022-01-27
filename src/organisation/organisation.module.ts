import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Organisation } from './organisation.entity';
import { OrganisationService } from './organisation.service';

@Module({
	imports: [MikroOrmModule.forFeature([Organisation])],
	providers: [OrganisationService],
	exports: [OrganisationService],
})
export class OrganisationModule {}
