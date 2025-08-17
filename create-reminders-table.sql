-- Create plant_reminders table directly
CREATE TABLE IF NOT EXISTS "plant_reminders" (
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
);

-- Add foreign key constraints
ALTER TABLE "plant_reminders" 
ADD CONSTRAINT "FK_plant_reminders_plant" 
FOREIGN KEY ("plantId") REFERENCES "pins"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Create indexes
CREATE INDEX IF NOT EXISTS "IDX_plant_reminders_plant" ON "plant_reminders" ("plantId");
CREATE INDEX IF NOT EXISTS "IDX_plant_reminders_status" ON "plant_reminders" ("status");
CREATE INDEX IF NOT EXISTS "IDX_plant_reminders_notification_type" ON "plant_reminders" ("notificationType");
CREATE INDEX IF NOT EXISTS "IDX_plant_reminders_due_date" ON "plant_reminders" ("dueDate");
CREATE INDEX IF NOT EXISTS "IDX_plant_reminders_recurring" ON "plant_reminders" ("isRecurring");
CREATE INDEX IF NOT EXISTS "IDX_plant_reminders_recurring_pattern" ON "plant_reminders" ("recurringPattern");

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS "IDX_plant_reminders_plant_status" ON "plant_reminders" ("plantId", "status");
CREATE INDEX IF NOT EXISTS "IDX_plant_reminders_plant_due_date" ON "plant_reminders" ("plantId", "dueDate");

-- Create index for overdue reminders
CREATE INDEX IF NOT EXISTS "IDX_plant_reminders_overdue" ON "plant_reminders" ("plantId", "status", "dueDate") 
WHERE "status" = 'active' AND "dueDate" < CURRENT_DATE;
