import { ObjectType, Field, ID, registerEnumType, GraphQLISODateTime, GraphQLDate } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Pin } from './pin.entity';

export enum NotificationType {
  GENERAL = 'general',
  WARNING = 'warning',
  ALERT = 'alert',
}

export enum ReminderStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISMISSED = 'dismissed',
  OVERDUE = 'overdue',
}

export enum RecurringPattern {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

registerEnumType(NotificationType, {
  name: 'NotificationType',
});

registerEnumType(ReminderStatus, {
  name: 'ReminderStatus',
});

registerEnumType(RecurringPattern, {
  name: 'RecurringPattern',
});

@ObjectType()
@Entity('plant_reminders')
export class Reminder {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  plantId: string;

  @Field(() => Pin)
  @ManyToOne(() => Pin, (pin) => pin.reminders)
  @JoinColumn({ name: 'plantId' })
  plant: Pin;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field(() => GraphQLDate)
  @Column({ type: 'date' })
  dueDate: Date;

  @Field({ nullable: true })
  @Column({ type: 'time', nullable: true })
  dueTime?: string;

  @Field(() => NotificationType)
  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.GENERAL,
  })
  notificationType: NotificationType;

  @Field(() => ReminderStatus)
  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.ACTIVE,
  })
  status: ReminderStatus;

  @Field()
  @Column({ default: false })
  isRecurring: boolean;

  @Field(() => RecurringPattern, { nullable: true })
  @Column({
    type: 'enum',
    enum: RecurringPattern,
    nullable: true,
  })
  recurringPattern?: RecurringPattern;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Column({ nullable: true })
  completedAt?: Date;

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn()
  updatedAt: Date;

  // createdById removed - we use plant.createdById for user ownership
}