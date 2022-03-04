import { Controller, Get } from '@nestjs/common';
import {
	HealthCheck,
	HealthCheckService,
	HttpHealthIndicator,
} from '@nestjs/terminus';

@Controller('status')
export class StatusController {
	constructor(
		private health: HealthCheckService,
		private http: HttpHealthIndicator,
	) {}

	@Get()
	@HealthCheck()
	check() {
		return this.health.check([
			() => this.http.pingCheck('google', 'https://google.com'),
			// () => this.db.pingCheck('database'),
		]);
	}
}
