import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

@Global()
@Module({
	providers: [
		{
			provide: 'PubSub',
			useFactory: (configService: ConfigService) => {
				const options: Redis.RedisOptions = {
					host: configService.get('REDIS_HOST') ?? 'localhost',
					port: configService.get('REDIS_PORT') ?? 6379,
				};
				return new RedisPubSub({
					publisher: new Redis(options),
					subscriber: new Redis(options),
				});
			},
			inject: [ConfigService],
		},
	],
	exports: ['PubSub'],
})
export class GlobalModule {}
