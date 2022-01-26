import { ConfigService } from '@nestjs/config';
import { DBConfig } from './src/db.config';

const factory = new DBConfig(new ConfigService());
export default factory.createMikroOrmOptions();
