import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRemindersTable1752000000001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create plant_reminders table
        await queryRunner.query(`
            CREATE TABLE "plant_reminders" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "plantId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "description" text,
                "dueDate" date NOT NULL,
                "dueTime" time,
                "notificationType" character varying(20) NOT NULL DEFAULT 'general',
                "status" character varying(20) NOT NULL DEFAULT 'active',
                "isRecurring" boolean NOT NULL DEFAULT false,
                "recurringPattern" character varying(20),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "completedAt" TIMESTAMP,
                CONSTRAINT "PK_plant_reminders" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "plant_reminders" 
            ADD CONSTRAINT "FK_plant_reminders_plant" 
            FOREIGN KEY ("plantId") REFERENCES "pins"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_plant_reminders_plant" ON "plant_reminders" ("plantId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_plant_reminders_status" ON "plant_reminders" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_plant_reminders_notification_type" ON "plant_reminders" ("notificationType")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_plant_reminders_due_date" ON "plant_reminders" ("dueDate")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_plant_reminders_recurring" ON "plant_reminders" ("isRecurring")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_plant_reminders_recurring_pattern" ON "plant_reminders" ("recurringPattern")
        `);

        // Create composite indexes for common queries
        await queryRunner.query(`
            CREATE INDEX "IDX_plant_reminders_plant_status" ON "plant_reminders" ("plantId", "status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_plant_reminders_plant_due_date" ON "plant_reminders" ("plantId", "dueDate")
        `);

        // Create index for overdue reminders
        await queryRunner.query(`
            CREATE INDEX "IDX_plant_reminders_overdue" ON "plant_reminders" ("plantId", "status", "dueDate") 
            WHERE "status" = 'active' AND "dueDate" < CURRENT_DATE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_plant_reminders_overdue"`);
        await queryRunner.query(`DROP INDEX "IDX_plant_reminders_plant_due_date"`);
        await queryRunner.query(`DROP INDEX "IDX_plant_reminders_plant_status"`);
        await queryRunner.query(`DROP INDEX "IDX_plant_reminders_recurring_pattern"`);
        await queryRunner.query(`DROP INDEX "IDX_plant_reminders_recurring"`);
        await queryRunner.query(`DROP INDEX "IDX_plant_reminders_due_date"`);
        await queryRunner.query(`DROP INDEX "IDX_plant_reminders_notification_type"`);
        await queryRunner.query(`DROP INDEX "IDX_plant_reminders_status"`);
        await queryRunner.query(`DROP INDEX "IDX_plant_reminders_plant"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "plant_reminders" DROP CONSTRAINT "FK_plant_reminders_plant"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "plant_reminders"`);
    }
}
