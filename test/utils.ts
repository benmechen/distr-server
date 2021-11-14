import { getConnection } from 'typeorm';

export class TestUtils {
	static async recreateDatabase() {
		const connection = getConnection();
		const queryRunner = connection.createQueryRunner();
		await queryRunner.dropDatabase('fe');
		await queryRunner.createDatabase('fe', true);
		queryRunner.release();
	}
}
