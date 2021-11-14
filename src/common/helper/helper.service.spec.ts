import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as faker from 'faker';
import { HelperService } from './helper.service';

describe('HelpersService', () => {
	let module: TestingModule;
	let service: HelperService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				HelperService,
				{
					provide: ConfigService,
					useValue: {
						get: (key: string) => key,
					},
				},
			],
		}).compile();

		service = module.get<HelperService>(HelperService);
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('isValidID returns true with a valid UUID', async () => {
		expect(service.isValidID(faker.datatype.uuid())).toEqual(true);
	});

	it('isValidID returns false with an invalid UUID', async () => {
		expect(service.isValidID(`${faker.datatype.uuid()}invalid`)).toEqual(
			false,
		);
	});

	it('toBase64 retuns a valid Base64 string', async () => {
		expect(service.toBase64('data')).toEqual(
			Buffer.from('data', 'binary').toString('base64'),
		);
	});

	it('fromBase64 retuns a valid string from a Base64 string', async () => {
		expect(
			service.fromBase64(
				Buffer.from('data', 'binary').toString('base64'),
			),
		).toEqual('data');
	});

	it('capitalises first letter', () => {
		const string = 'Teststring';
		const capilaised = service.capitaliseFirst(string.toLowerCase());
		expect(capilaised).toEqual(string);
	});
});
