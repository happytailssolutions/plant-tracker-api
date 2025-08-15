import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectUser } from './entities/project-user.entity';
import { ProjectsService } from './services/projects.service';
import { ProjectsResolver } from './resolvers/projects.resolver';
import { User } from '../users/entities/user.entity';
import { Pin } from '../pins/entities/pin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectUser, User, Pin])],
  providers: [ProjectsService, ProjectsResolver],
  exports: [ProjectsService],
})
export class ProjectsModule {} 