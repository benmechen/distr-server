import { MinLength } from 'class-validator';

export class CreateOrganisationDTO {
	@MinLength(3)
	name: string;
}
