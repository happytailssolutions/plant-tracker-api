import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateReminderInput } from './create-reminder.input';

@InputType()
export class UpdateReminderInput extends PartialType(CreateReminderInput) {
  @Field(() => ID)
  @IsUUID('4')
  id: string;
}