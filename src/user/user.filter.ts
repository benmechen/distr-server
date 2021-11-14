import { Field } from '@nestjs/graphql';
import { ConnectionFilter } from '../common/base/connection.filter';
import { User, UserRole } from './user.entity';

export class UserConnectionFilter
	extends ConnectionFilter
	implements Partial<User>
{
	@Field(() => UserRole, {
		nullable: true,
		description: "User's role",
	})
	role: UserRole;
}
