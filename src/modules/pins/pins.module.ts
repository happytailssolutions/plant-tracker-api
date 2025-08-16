import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pin } from './entities/pin.entity';
import { Reminder } from './entities/reminder.entity';
import { PinsService } from './services/pins.service';
import { RemindersService } from './services/reminders.service';
import { PinsResolver } from './resolvers/pins.resolver';
import { RemindersResolver } from './resolvers/reminders.resolver';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectUser } from '../projects/entities/project-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pin, Reminder, User, Project, ProjectUser])],
  providers: [PinsService, RemindersService, PinsResolver, RemindersResolver],
  exports: [PinsService, RemindersService],
})
export class PinsModule {} 