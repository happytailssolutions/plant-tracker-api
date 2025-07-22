import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePinsTable1751863592557 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable PostGIS extension first
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

        // Create pins table
        await queryRunner.query(`
            CREATE TABLE "pins" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text,
                "location" GEOGRAPHY(Point, 4326) NOT NULL,
                "latitude" decimal(10,8) NOT NULL,
                "longitude" decimal(11,8) NOT NULL,
                "pinType" character varying(100) NOT NULL DEFAULT 'plant',
                "status" character varying(50) NOT NULL DEFAULT 'active',
                "metadata" jsonb,
                "isPublic" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "projectId" uuid NOT NULL,
                "createdById" uuid NOT NULL,
                CONSTRAINT "PK_pins" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "pins" 
            ADD CONSTRAINT "FK_pins_project" 
            FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "pins" 
            ADD CONSTRAINT "FK_pins_created_by" 
            FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_pins_project" ON "pins" ("projectId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_pins_created_by" ON "pins" ("createdById")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_pins_status" ON "pins" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_pins_type" ON "pins" ("pinType")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_pins_is_active" ON "pins" ("isActive")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_pins_is_public" ON "pins" ("isPublic")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_pins_coordinates" ON "pins" ("latitude", "longitude")
        `);

        // Create spatial index using GIST for PostGIS geography column
        await queryRunner.query(`
            CREATE INDEX "IDX_pins_location_spatial" ON "pins" USING GIST ("location")
        `);

        // Create composite indexes for common queries
        await queryRunner.query(`
            CREATE INDEX "IDX_pins_project_active" ON "pins" ("projectId", "isActive")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_pins_project_type" ON "pins" ("projectId", "pinType")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_pins_created_at" ON "pins" ("createdAt")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_pins_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_pins_project_type"`);
        await queryRunner.query(`DROP INDEX "IDX_pins_project_active"`);
        await queryRunner.query(`DROP INDEX "IDX_pins_location_spatial"`);
        await queryRunner.query(`DROP INDEX "IDX_pins_coordinates"`);
        await queryRunner.query(`DROP INDEX "IDX_pins_is_public"`);
        await queryRunner.query(`DROP INDEX "IDX_pins_is_active"`);
        await queryRunner.query(`DROP INDEX "IDX_pins_type"`);
        await queryRunner.query(`DROP INDEX "IDX_pins_status"`);
        await queryRunner.query(`DROP INDEX "IDX_pins_created_by"`);
        await queryRunner.query(`DROP INDEX "IDX_pins_project"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "pins" DROP CONSTRAINT "FK_pins_created_by"`);
        await queryRunner.query(`ALTER TABLE "pins" DROP CONSTRAINT "FK_pins_project"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "pins"`);

        // Note: We don't drop the PostGIS extension as it might be used by other tables
    }

} 