import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreatePinInput } from './create-pin.input';

@InputType()
export class UpdatePinInput extends PartialType(CreatePinInput) {
  @Field()
  @IsUUID('4')
  id: string;
} 