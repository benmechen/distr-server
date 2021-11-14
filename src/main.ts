import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express/interfaces/nest-express-application.interface';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { LogExceptionsHandlerFilter } from './common/log-exceptions-handler.filter';
import { runDbMigrations } from './migration';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	const configService = app.get(ConfigService);

	app.useGlobalFilters(new LogExceptionsHandlerFilter(configService));

	// Ensure DB is up to date as part of start up procedure
	if (configService.get<string>('RUN_MIGRATIONS') === 'true')
		await runDbMigrations(configService);

	// Forward end user IP
	app.set('trust proxy', true);

	const corsOriginString = configService.get<string>('FRONTEND') ?? '';
	const corsOrigins = corsOriginString.split(',') ?? [];

	app.enableCors({
		origin: corsOrigins,
		credentials: true,
	});

	app.use(cookieParser());

	// Use class validator
	app.useGlobalPipes(new ValidationPipe());

	// Enable shutdown hooks for status checks
	app.enableShutdownHooks();

	const port = configService.get('PORT') ?? 4000;
	await app.listen(port);
	// eslint-disable-next-line
	console.log(`🚀 Server ready on port ${port}`);
}
bootstrap();
