import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateProjectInput } from './create-project.input';
import { GraphQLJSON } from 'graphql-type-json';

@InputType()
export class UpdateProjectInput extends PartialType(CreateProjectInput) {
  @Field()
  @IsUUID()
  id: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
} 