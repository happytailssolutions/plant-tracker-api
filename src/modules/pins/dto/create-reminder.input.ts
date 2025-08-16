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
} from '../entities/reminder.entity';

@InputType()
export class CreateReminderInput {
  @Field()
  @IsString()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsDateString()
  dueDate: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  dueTime?: string;

  @Field(() => NotificationType)
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @Field(() => RecurringPattern, { nullable: true })
  @IsOptional()
  @IsEnum(RecurringPattern)
  recurringPattern?: RecurringPattern;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @Field()
  @IsUUID('4')
  plantId: string;
}
