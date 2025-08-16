import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUUID,
  IsArray,
  Length,
  IsIn,
} from 'class-validator';
import { GraphQLJSON } from 'graphql-type-json';

@InputType()
export class CreateProjectInput {
  @Field()
  @IsString()
  @Length(3, 100, {
    message: 'Project name must be between 3 and 100 characters',
  })
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  area?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  areaUnit?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsIn(
    ['', 'Garden', 'Farm', 'Reforestation', 'Orchard/Grove', 'Permaculture'],
    {
      message:
        'Project type must be one of: Garden, Farm, Reforestation, Orchard/Grove, Permaculture',
    },
  )
  projectType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  status?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  metadata?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];
}
