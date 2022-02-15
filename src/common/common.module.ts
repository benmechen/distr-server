import { Global, Module } from '@nestjs/common';
import { CipherService } from './cipher/cipher.service';
import { HelperService } from './helper/helper.service';

@Global()
@Module({
	providers: [HelperService, CipherService],
	exports: [HelperService, CipherService],
})
export class CommonModule {}
