import { HttpModule, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ServiceService } from './service.service';
import { CreateResolver } from './create/create.resolver';
import { Service } from './service.entity';
import { ServiceResolver } from './service.resolver';

@Module({
	imports: [MikroOrmModule.forFeature([Service]), HttpModule],
	providers: [ServiceService, ServiceResolver, CreateResolver],
	exports: [ServiceService],
})
export class ServiceModule {}
