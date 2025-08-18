import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { getTypeOrmConfig } from './core/database/typeorm.config';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PinsModule } from './modules/pins/pins.module';
import { AuthModule } from './auth/auth.module';
import { Pin } from './modules/pins/entities/pin.entity';
import { Reminder } from './modules/pins/entities/reminder.entity';
import { User } from './modules/users/entities/user.entity';
import { Project } from './modules/projects/entities/project.entity';
import { ProjectUser } from './modules/projects/entities/project-user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const config = await getTypeOrmConfig(configService);
        return {
          ...config,
          entities: [Pin, Reminder, User, Project, ProjectUser],
        };
      },
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'dist/schema.gql',
      sortSchema: true,
      playground: true,
      debug: true,
      introspection: true,
      buildSchemaOptions: {
        dateScalarMode: 'isoDate',
        numberScalarMode: 'float',
      },
      context: ({ req }) => ({ req }),
    }),
    UsersModule,
    ProjectsModule,
    PinsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
