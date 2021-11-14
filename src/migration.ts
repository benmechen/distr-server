/**
 * Migration Utility Functions
 */

import { ConfigService } from '@nestjs/config';
import { ConnectionOptions, getConnection } from 'typeorm';
import { LoggerFactory } from './common/logger';

export const getDbConnection = async (connectionName = 'default') => {
	return getConnection(connectionName);
};

/**
 * Run all new migrations
 * @param configService Configuration Service
 * @param connectionName Connection name. Default `default`
 */
export const runDbMigrations = async (
	configService: ConfigService,
	connectionName = 'default',
) => {
	const logger = new LoggerFactory(configService).getLogger(
		'MigrationsRunner',
	);

	const conn = await getDbConnection(connectionName);

	logger.info('Running migrations', {
		connectionName,
	});

	await conn.runMigrations();
};

const configService = new ConfigService();

/**
 * Database configuration for migrations
 */
const config: ConnectionOptions = {
	type: 'postgres',
	host: configService.get('DB_HOST'),
	port: +(configService.get<number>('DB_PORT') ?? 5432),
	username: configService.get('DB_USER'),
	password: configService.get<string>('DB_PASSWORD'),
	database: configService.get('DB_NAME'),
	entities: [`${__dirname}/**/*.entity{.ts,.js}`],
	logging: true,
	migrations: [`${__dirname}/migrations/**/*{.ts,.js}`],
	synchronize: false,
	migrationsRun: configService.get<string>('RUN_MIGRATIONS') === 'true',
	cli: {
		// Location of migration should be inside src folder
		// to be compiled into dist/ folder.
		migrationsDir: 'src/migrations',
	},
};

export default config;
