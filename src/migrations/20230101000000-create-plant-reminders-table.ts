import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlantRemindersTable1672531200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE plant_reminders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATE NOT NULL,
        due_time TIME,
        notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('general', 'warning', 'alert')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed', 'overdue')),
        is_recurring BOOLEAN DEFAULT FALSE,
        recurring_pattern VARCHAR(20), -- 'weekly', 'monthly', 'yearly'
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX idx_plant_reminders_plant_id ON plant_reminders(plant_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_plant_reminders_due_date ON plant_reminders(due_date);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_plant_reminders_status ON plant_reminders(status);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_plant_reminders_notification_type ON plant_reminders(notification_type);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE plant_reminders;`);
  }
}
