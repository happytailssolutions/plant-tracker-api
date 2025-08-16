import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import {
  NotificationType,
  RecurringPattern,
  ReminderStatus,
} from '../entities/reminder.entity';

@InputType()
export class UpdateReminderInput {
  @Field()
  @IsUUID('4')
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  dueTime?: string;

  @Field(() => NotificationType, { nullable: true })
  @IsOptional()
  @IsEnum(NotificationType)
  notificationType?: NotificationType;

  @Field(() => ReminderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;

  @Field(() => RecurringPattern, { nullable: true })
  @IsOptional()
  @IsEnum(RecurringPattern)
  recurringPattern?: RecurringPattern;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
