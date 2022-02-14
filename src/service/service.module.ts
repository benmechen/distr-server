import { HttpModule, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ServiceService } from './service.service';
import { CreateResolver } from './create/create.resolver';
import { Service } from './service.entity';

@Module({
	imports: [MikroOrmModule.forFeature([Service]), HttpModule],
	providers: [ServiceService, CreateResolver],
	exports: [ServiceService],
})
export class ServiceModule {}
