import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProjectsTable1751841638311 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create projects table
        await queryRunner.query(`
            CREATE TABLE "projects" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text,
                "location" point,
                "latitude" decimal(10,8),
                "longitude" decimal(11,8),
                "area" decimal(5,2),
                "areaUnit" character varying(50),
                "projectType" character varying(100),
                "status" character varying(50),
                "startDate" date,
                "endDate" date,
                "metadata" jsonb,
                "isPublic" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "ownerId" uuid NOT NULL,
                CONSTRAINT "PK_projects" PRIMARY KEY ("id")
            )
        `);

        // Create project_users table
        await queryRunner.query(`
            CREATE TABLE "project_users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "projectId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "role" character varying(50) NOT NULL DEFAULT 'member',
                "permissions" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_project_users" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "projects" 
            ADD CONSTRAINT "FK_projects_owner" 
            FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "project_users" 
            ADD CONSTRAINT "FK_project_users_project" 
            FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "project_users" 
            ADD CONSTRAINT "FK_project_users_user" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_projects_owner" ON "projects" ("ownerId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_projects_status" ON "projects" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_projects_is_active" ON "projects" ("isActive")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_projects_is_public" ON "projects" ("isPublic")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_projects_location" ON "projects" USING GIST ("location")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_projects_coordinates" ON "projects" ("latitude", "longitude")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_project_users_project" ON "project_users" ("projectId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_project_users_user" ON "project_users" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_project_users_role" ON "project_users" ("role")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_project_users_is_active" ON "project_users" ("isActive")
        `);

        // Create unique constraint for project_user combination
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_project_users_unique" ON "project_users" ("projectId", "userId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_project_users_unique"`);
        await queryRunner.query(`DROP INDEX "IDX_project_users_is_active"`);
        await queryRunner.query(`DROP INDEX "IDX_project_users_role"`);
        await queryRunner.query(`DROP INDEX "IDX_project_users_user"`);
        await queryRunner.query(`DROP INDEX "IDX_project_users_project"`);
        await queryRunner.query(`DROP INDEX "IDX_projects_coordinates"`);
        await queryRunner.query(`DROP INDEX "IDX_projects_location"`);
        await queryRunner.query(`DROP INDEX "IDX_projects_is_public"`);
        await queryRunner.query(`DROP INDEX "IDX_projects_is_active"`);
        await queryRunner.query(`DROP INDEX "IDX_projects_status"`);
        await queryRunner.query(`DROP INDEX "IDX_projects_owner"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "project_users" DROP CONSTRAINT "FK_project_users_user"`);
        await queryRunner.query(`ALTER TABLE "project_users" DROP CONSTRAINT "FK_project_users_project"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_projects_owner"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "project_users"`);
        await queryRunner.query(`DROP TABLE "projects"`);
    }

}
