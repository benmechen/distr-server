import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from '@chelseaapps/notification';
import { WinstonModule } from 'nest-winston';
import { UserModule } from './user/user.module';
import { GqlConfigService } from './apollo.config';
import { StatusController } from './status/status.controller';
import { AuthModule } from './auth/auth.module';
import { DBConfig } from './db.config';
import { GlobalModule } from './global.module';
import { CommonModule } from './common/common.module';
import { NotificationConfig } from './notification/notification.config';
import { LoggingPlugin } from './common/plugins/logging.plugin';
import { ComplexityPlugin } from './common/plugins/complexity.plugin';
import { HelperService } from './common/helper/helper.service';
import { WinstonConfig } from './winston.config';
import { OrganisationModule } from './organisation/organisation.module';
import { SystemModule } from './system/system.module';
import { ServiceModule } from './service/service.module';

@Module({
	imports: [
		WinstonModule.forRootAsync({
			imports: [ConfigModule],
			useClass: WinstonConfig,
		}),
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		GraphQLModule.forRootAsync<ApolloDriverConfig>({
			imports: [ConfigModule],
			driver: ApolloDriver,
			useClass: GqlConfigService,
			inject: [ConfigService],
		}),
		// Main DB
		MikroOrmModule.forRootAsync({
			inject: [ConfigService],
			useClass: DBConfig,
		}),
		// TypeOrmModule.forRootAsync({
		// 	imports: [ConfigModule],
		// 	useFactory: (configService: ConfigService) =>
		// 		dbConfig(configService, {
		// 			dbNameKey: 'DB_NAME',
		// 			name: 'default',
		// 			synchronize: true,
		// 			cache: true,
		// 		}),
		// 	inject: [ConfigService],
		// }),
		BullModule.forRootAsync({
			useFactory: (configService: ConfigService) => ({
				redis: {
					host: configService.get('REDIS_HOST') ?? 'localhost',
					port: configService.get('REDIS_PORT') ?? 6379,
				},
			}),
			inject: [ConfigService],
		}),
		NotificationModule.registerAsync({
			isGlobal: true,
			inject: [HelperService, ConfigService],
			useClass: NotificationConfig,
		}),
		ScheduleModule.forRoot(),
		GlobalModule,
		TerminusModule,
		UserModule,
		AuthModule,
		CommonModule,
		OrganisationModule,
		SystemModule,
		ServiceModule,
	],
	controllers: [StatusController],
	providers: [LoggingPlugin, ComplexityPlugin],
})
export class AppModule {}
