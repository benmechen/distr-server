import { registerEnumType } from '@nestjs/graphql';

export enum Platform {
	AWS = 'AWS',
	Azure = 'Azure',
	GCP = 'GCP',
	Other = 'Other',
}
registerEnumType(Platform, {
	name: 'Platform',
	description: 'Platforms services can be hosted on',
});
