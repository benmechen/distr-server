import { Controller, Get } from '@nestjs/common';
import {
	HealthCheck,
	HealthCheckService,
	HttpHealthIndicator,
	TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('status')
export class StatusController {
	constructor(
		private health: HealthCheckService,
		private http: HttpHealthIndicator,
		private db: TypeOrmHealthIndicator,
	) {}

	@Get()
	@HealthCheck()
	check() {
		return this.health.check([
			() => this.http.pingCheck('google', 'https://google.com'),
			() => this.db.pingCheck('database'),
		]);
	}
}
