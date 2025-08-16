import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
@Entity('projects')
export class Project {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  location: string;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  area: number;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  areaUnit: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  projectType: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  endDate: Date;

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
  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Field({ nullable: true })
  @Column({ type: 'uuid' })
  ownerId: string;

  @Field(() => [User])
  @ManyToMany(() => User)
  @JoinTable({
    name: 'project_users',
    joinColumn: {
      name: 'projectId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  members: User[];

  @Field(() => Number)
  pinsCount: number;
}
