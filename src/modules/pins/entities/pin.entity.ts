import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
@Entity('pins')
export class Pin {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @Field()
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  location: string;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Field()
  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Field()
  @Column({ type: 'varchar', length: 100, default: 'plant' })
  pinType: string;

  @Field()
  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: object;

  @Field()
  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Field()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @Field(() => Project)
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Field()
  @Column({ type: 'uuid' })
  projectId: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Field()
  @Column({ type: 'uuid' })
  createdById: string;
} 