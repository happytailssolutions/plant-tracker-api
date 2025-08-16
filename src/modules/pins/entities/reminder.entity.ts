import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum ReminderStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISMISSED = 'dismissed',
  OVERDUE = 'overdue',
}

export enum NotificationType {
  GENERAL = 'general',
  WARNING = 'warning',
  ALERT = 'alert',
}

export enum RecurringPattern {
  NONE = 'none',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

registerEnumType(ReminderStatus, {
  name: 'ReminderStatus',
  description: 'The status of a reminder',
});

registerEnumType(NotificationType, {
  name: 'NotificationType',
  description: 'The type of notification for a reminder',
});

registerEnumType(RecurringPattern, {
  name: 'RecurringPattern',
  description: 'The recurring pattern for a reminder',
});

@ObjectType()
@Entity('reminders')
export class Reminder {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @Field()
  @Column({ type: 'date' })
  dueDate: Date;

  @Field({ nullable: true })
  @Column({ type: 'time', nullable: true })
  dueTime: string;

  @Field(() => NotificationType)
  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.ALERT,
  })
  notificationType: NotificationType;

  @Field(() => ReminderStatus)
  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.ACTIVE,
  })
  status: ReminderStatus;

  @Field(() => RecurringPattern)
  @Column({
    type: 'enum',
    enum: RecurringPattern,
    default: RecurringPattern.NONE,
  })
  recurringPattern: RecurringPattern;

  @Field()
  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  // Relationships
  @Field(() => String)
  @Column({ type: 'uuid' })
  plantId: string;

  @Field(() => String)
  @Column({ type: 'uuid' })
  createdById: string;
}
