import { UserCreateInput } from './create.input';
import { UserRole } from '../user.entity';
import { Organisation } from '../../organisation/organisation.entity';

export class CreateUserDTO extends UserCreateInput {
	role: UserRole;

	organisation: Organisation;
}
