import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRemindersTable1752000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create reminders table
    await queryRunner.query(`
            CREATE TABLE "reminders" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(255) NOT NULL,
                "description" text,
                "dueDate" date NOT NULL,
                "dueTime" time,
                "notificationType" character varying(20) NOT NULL DEFAULT 'alert',
                "status" character varying(20) NOT NULL DEFAULT 'active',
                "recurringPattern" character varying(20) NOT NULL DEFAULT 'none',
                "isRecurring" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "completedAt" TIMESTAMP,
                "plantId" uuid NOT NULL,
                "createdById" uuid NOT NULL,
                CONSTRAINT "PK_reminders" PRIMARY KEY ("id")
            )
        `);

    // Add foreign key constraints
    await queryRunner.query(`
            ALTER TABLE "reminders" 
            ADD CONSTRAINT "FK_reminders_plant" 
            FOREIGN KEY ("plantId") REFERENCES "pins"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "reminders" 
            ADD CONSTRAINT "FK_reminders_created_by" 
            FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    // Create indexes
    await queryRunner.query(`
            CREATE INDEX "IDX_reminders_plant" ON "reminders" ("plantId")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_reminders_created_by" ON "reminders" ("createdById")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_reminders_status" ON "reminders" ("status")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_reminders_notification_type" ON "reminders" ("notificationType")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_reminders_due_date" ON "reminders" ("dueDate")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_reminders_recurring" ON "reminders" ("isRecurring")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_reminders_recurring_pattern" ON "reminders" ("recurringPattern")
        `);

    // Create composite indexes for common queries
    await queryRunner.query(`
            CREATE INDEX "IDX_reminders_plant_status" ON "reminders" ("plantId", "status")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_reminders_user_status" ON "reminders" ("createdById", "status")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_reminders_user_due_date" ON "reminders" ("createdById", "dueDate")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_reminders_plant_due_date" ON "reminders" ("plantId", "dueDate")
        `);

    // Create index for overdue reminders
    await queryRunner.query(`
            CREATE INDEX "IDX_reminders_overdue" ON "reminders" ("createdById", "status", "dueDate") 
            WHERE "status" = 'active' AND "dueDate" < CURRENT_DATE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_reminders_overdue"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_plant_due_date"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_user_due_date"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_user_status"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_plant_status"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_recurring_pattern"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_recurring"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_due_date"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_notification_type"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_status"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_created_by"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_plant"`);

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "reminders" DROP CONSTRAINT "FK_reminders_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reminders" DROP CONSTRAINT "FK_reminders_plant"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE "reminders"`);
  }
}
