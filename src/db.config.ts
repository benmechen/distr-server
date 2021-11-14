import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const dbConfig = (
	configService: ConfigService,
	config: {
		/**
		 * Env key for the database name
		 */
		dbNameKey: string;
		/**
		 * TypeORM connection name ("default")
		 */
		name?: string;
		/**
		 * Prefix for entities when using multiple databases
		 */
		entityPrefix?: string;
		/**
		 * Synchronise the connection?
		 */
		synchronize?: boolean;
		/**
		 * Cache results?
		 */
		cache?: boolean;
	},
): TypeOrmModuleOptions => ({
	type: 'postgres',
	name: config.name ?? configService.get(config.dbNameKey) ?? undefined,
	host: configService.get('DB_HOST'),
	port: +(configService.get<number>('DB_PORT') ?? 5432),
	username: configService.get('DB_USER'),
	password: configService.get('DB_PASSWORD'),
	database: configService.get(config.dbNameKey),
	entities: [`${__dirname}/**/*.entity${config.entityPrefix ?? ''}{.ts,.js}`],
	migrations: [`${__dirname}/migrations/**/*{.ts,.js}`],
	synchronize: config.synchronize,
	cache:
		config.cache !== false
			? {
					type: 'redis',
					duration: configService.get('DB_CACHE_TTL') ?? 10000,
					options: {
						host: process.env.REDIS_HOST ?? 'localhost',
						port: process.env.REDIS_PORT ?? 6379,
					},
			  }
			: undefined,
	cli: {
		entitiesDir: 'src',
		migrationsDir: 'src/migrations',
	},
});
