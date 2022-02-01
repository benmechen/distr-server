import { InputType, PartialType } from '@nestjs/graphql';
import { DeploymentCreateInput } from '../create/create.input';

@InputType()
export class DeploymentUpdateInput extends PartialType(DeploymentCreateInput) {}
