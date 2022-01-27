import { UserCreateInput } from './create.input';
import { UserRole } from '../user.entity';

export class CreateUserDTO extends UserCreateInput {
	role: UserRole;
}
