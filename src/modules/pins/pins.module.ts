import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pin } from './entities/pin.entity';
import { PinsService } from './services/pins.service';
import { PinsResolver } from './resolvers/pins.resolver';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectUser } from '../projects/entities/project-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pin, User, Project, ProjectUser])],
  providers: [PinsService, PinsResolver],
  exports: [PinsService],
})
export class PinsModule {} 