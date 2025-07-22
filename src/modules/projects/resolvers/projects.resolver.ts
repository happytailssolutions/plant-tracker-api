import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { ProjectsService } from '../services/projects.service';
import { Project } from '../entities/project.entity';
import { CreateProjectInput } from '../dto/create-project.input';
import { UpdateProjectInput } from '../dto/update-project.input';

@Resolver(() => Project)
export class ProjectsResolver {
  constructor(private projectsService: ProjectsService) {}

  @Query(() => [Project])
  @UseGuards(GqlAuthGuard)
  async myProjects(@CurrentUser() user: any): Promise<Project[]> {
    return this.projectsService.findMyProjects(user.id);
  }

  @Query(() => Project)
  @UseGuards(GqlAuthGuard)
  async project(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: any): Promise<Project> {
    return this.projectsService.findProjectById(id, user.id);
  }

  @Mutation(() => Project)
  @UseGuards(GqlAuthGuard)
  async createProject(
    @Args('input') createProjectInput: CreateProjectInput,
    @CurrentUser() user: any,
  ): Promise<Project> {
    console.log('CreateProject Resolver - CurrentUser:', user);
    return this.projectsService.createProject(createProjectInput, user.id);
  }

  @Mutation(() => Project)
  @UseGuards(GqlAuthGuard)
  async updateProject(
    @Args('input') updateProjectInput: UpdateProjectInput,
    @CurrentUser() user: any,
  ): Promise<Project> {
    return this.projectsService.updateProject(updateProjectInput, user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteProject(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    return this.projectsService.deleteProject(id, user.id);
  }

  @Mutation(() => Project)
  @UseGuards(GqlAuthGuard)
  async addProjectMember(
    @Args('projectId', { type: () => ID }) projectId: string,
    @Args('memberId', { type: () => ID }) memberId: string,
    @CurrentUser() user: any,
  ): Promise<Project> {
    return this.projectsService.addProjectMember(projectId, memberId, user.id);
  }

  @Mutation(() => Project)
  @UseGuards(GqlAuthGuard)
  async removeProjectMember(
    @Args('projectId', { type: () => ID }) projectId: string,
    @Args('memberId', { type: () => ID }) memberId: string,
    @CurrentUser() user: any,
  ): Promise<Project> {
    return this.projectsService.removeProjectMember(projectId, memberId, user.id);
  }
} 