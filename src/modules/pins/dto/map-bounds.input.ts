import { InputType, Field } from '@nestjs/graphql';
import { IsNumber, IsOptional } from 'class-validator';

@InputType()
export class MapBoundsInput {
  @Field()
  @IsNumber()
  north: number;

  @Field()
  @IsNumber()
  south: number;

  @Field()
  @IsNumber()
  east: number;

  @Field()
  @IsNumber()
  west: number;

  @Field({ nullable: true })
  @IsOptional()
  projectId?: string;
} 