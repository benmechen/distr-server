import { PartialType } from '@nestjs/graphql';
import { CreateOrganisationDTO } from './create-organisation.dto';

export class UpdateOrganisationDTO extends PartialType(CreateOrganisationDTO) {}
