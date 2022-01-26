import {
	MikroOrmModuleOptions,
	MikroOrmOptionsFactory,
} from '@mikro-orm/nestjs';
import { MySqlDriver } from '@mikro-orm/mysql';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { User } from './user/user.entity';
import { Code } from './auth/code/code.entity';
import { Token } from './common/token/token.entity';
import { Article } from './article/article.entity';

@Injectable()
export class DBConfig implements MikroOrmOptionsFactory<MySqlDriver> {
	constructor(private configService: ConfigService) {}

	createMikroOrmOptions():
		| MikroOrmModuleOptions<MySqlDriver>
		| Promise<MikroOrmModuleOptions<MySqlDriver>> {
		return {
			type: 'mysql',
			host: this.configService.get('DB_HOST'),
			dbName: this.configService.get('DB_NAME'),
			port: +(this.configService.get<number>('DB_PORT') ?? 3306),
			user: this.configService.get('DB_USER'),
			password: this.configService.get('DB_PASSWORD'),
			// autoLoadEntities: true,
			entities: [User, Code, Token, Article],
			cache: {
				enabled: true,
			},
		};
	}
}

// export const dbConfig = (
// 	configService: ConfigService,
// 	config: {
// 		/**
// 		 * Env key for the database name
// 		 */
// 		dbNameKey: string;
// 		/**
// 		 * TypeORM connection name ("default")
// 		 */
// 		name?: string;
// 		/**
// 		 * Prefix for entities when using multiple databases
// 		 */
// 		entityPrefix?: string;
// 		/**
// 		 * Synchronise the connection?
// 		 */
// 		synchronize?: boolean;
// 		/**
// 		 * Cache results?
// 		 */
// 		cache?: boolean;
// 	},
// ): TypeOrmModuleOptions => ({
// 	type: 'mysql',
// 	name: config.name ?? configService.get(config.dbNameKey) ?? undefined,
// 	host: configService.get('DB_HOST'),
// 	port: +(configService.get<number>('DB_PORT') ?? 5432),
// 	username: configService.get('DB_USER'),
// 	password: configService.get('DB_PASSWORD'),
// 	database: configService.get(config.dbNameKey),
// 	entities: [`${__dirname}/**/*.entity${config.entityPrefix ?? ''}{.ts,.js}`],
// 	migrations: [`${__dirname}/migrations/**/*{.ts,.js}`],
// 	synchronize: config.synchronize,
// 	cache:
// 		config.cache !== false
// 			? {
// 					type: 'redis',
// 					duration: configService.get('DB_CACHE_TTL') ?? 10000,
// 					options: {
// 						host: process.env.REDIS_HOST ?? 'localhost',
// 						port: process.env.REDIS_PORT ?? 6379,
// 					},
// 			  }
// 			: undefined,
// 	cli: {
// 		entitiesDir: 'src',
// 		migrationsDir: 'src/migrations',
// 	},
// });
