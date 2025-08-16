import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixProjectLocationField1752000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the spatial index on location field first
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_projects_location"`);

    // Change the location column from point to text
    await queryRunner.query(
      `ALTER TABLE "projects" ALTER COLUMN "location" TYPE text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to point type
    await queryRunner.query(
      `ALTER TABLE "projects" ALTER COLUMN "location" TYPE point`,
    );

    // Recreate the spatial index
    await queryRunner.query(
      `CREATE INDEX "IDX_projects_location" ON "projects" USING GIST ("location")`,
    );
  }
}
