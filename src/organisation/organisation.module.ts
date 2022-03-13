import { MikroOrmModule } from '@mikro-orm/nestjs';
import { forwardRef, Module } from '@nestjs/common';
import { Organisation } from './organisation.entity';
import { OrganisationService } from './organisation.service';
import { UpdateResolver } from './update/update.resolver';
import { OrganisationResolver } from './organisation.resolver';
import { RemoveMemberResolver } from './remove-member/remove-member.resolver';
import { UserModule } from '../user/user.module';
import { AddMemberResolver } from './add-member/add-member.resolver';

@Module({
	imports: [
		MikroOrmModule.forFeature([Organisation]),
		forwardRef(() => UserModule),
	],
	providers: [
		OrganisationService,
		UpdateResolver,
		OrganisationResolver,
		RemoveMemberResolver,
		AddMemberResolver,
	],
	exports: [OrganisationService],
})
export class OrganisationModule {}
