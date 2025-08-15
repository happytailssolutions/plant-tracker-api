import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project } from '../entities/project.entity';
import { ProjectUser } from '../entities/project-user.entity';
import { CreateProjectInput } from '../dto/create-project.input';
import { UpdateProjectInput } from '../dto/update-project.input';
import { User } from '../../users/entities/user.entity';
import { Pin } from '../../pins/entities/pin.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(ProjectUser)
    private projectUsersRepository: Repository<ProjectUser>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Pin)
    private pinsRepository: Repository<Pin>,
  ) {}

  async findMyProjects(userId: string): Promise<Project[]> {
    // Find all projects where the user is either owner or member
    const projectUsers = await this.projectUsersRepository.find({
      where: { userId, isActive: true },
      relations: ['project', 'project.owner', 'project.members'],
    });

    // Filter out any null projects
    const projects = projectUsers.map(pu => pu.project).filter(Boolean) as Project[];

    // Calculate pins count for each project
    for (const project of projects) {
      const pinsCount = await this.pinsRepository.count({
        where: { projectId: project.id, isActive: true },
      });
      project.pinsCount = pinsCount;
    }

    return projects;
  }

  async findProjectById(projectId: string, userId: string): Promise<Project> {
    // Check if user has access to this project
    const projectUser = await this.projectUsersRepository.findOne({
      where: { projectId, userId, isActive: true },
      relations: ['project', 'project.owner'],
    });

    if (!projectUser) {
      throw new NotFoundException('Project not found or access denied');
    }

    return projectUser.project;
  }

  async createProject(createProjectInput: CreateProjectInput, userId: string): Promise<Project> {
    // Create the project
    const project = new Project();
    Object.assign(project, {
      ...createProjectInput,
      ownerId: userId,
      startDate: createProjectInput.startDate ? new Date(createProjectInput.startDate) : null,
      endDate: createProjectInput.endDate ? new Date(createProjectInput.endDate) : null,
    });

    const savedProject = await this.projectsRepository.save(project);

    // Add the owner as a project user with 'owner' role
    await this.projectUsersRepository.save({
      projectId: savedProject.id,
      userId: userId,
      role: 'owner',
      isActive: true,
    });

    // Add additional members if specified
    if (createProjectInput.memberIds && createProjectInput.memberIds.length > 0) {
      const memberUsers = await this.usersRepository.find({
        where: { id: In(createProjectInput.memberIds) },
      });

      if (memberUsers.length > 0) {
        const projectUsers = memberUsers.map(user => ({
          projectId: savedProject.id,
          userId: user.id,
          role: 'member',
          isActive: true,
        }));

        await this.projectUsersRepository.save(projectUsers);
      }
    }

    // Return the project with relations
    const result = await this.projectsRepository.findOne({
      where: { id: savedProject.id },
      relations: ['owner', 'members'],
    });
    
    if (!result) {
      throw new NotFoundException('Failed to create project');
    }
    
    return result;
  }

  async updateProject(updateProjectInput: UpdateProjectInput, userId: string): Promise<Project> {
    const { id, ...updateData } = updateProjectInput;

    // Check if user has access to this project (owner or member with edit permissions)
    const projectUser = await this.projectUsersRepository.findOne({
      where: { projectId: id, userId, isActive: true },
      relations: ['project'],
    });

    if (!projectUser) {
      throw new NotFoundException('Project not found or access denied');
    }

    // Only owners can update project details
    if (projectUser.role !== 'owner') {
      throw new ForbiddenException('Only project owners can update project details');
    }

    // Update the project
    await this.projectsRepository.update(id, {
      ...updateData,
      startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
      endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
    });

    // Return the updated project
    const result = await this.projectsRepository.findOne({
      where: { id },
      relations: ['owner', 'members'],
    });
    
    if (!result) {
      throw new NotFoundException('Project not found after update');
    }
    
    return result;
  }

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    // Check if user is the owner of this project
    const projectUser = await this.projectUsersRepository.findOne({
      where: { projectId, userId, isActive: true },
      relations: ['project'],
    });

    if (!projectUser) {
      throw new NotFoundException('Project not found or access denied');
    }

    // Only owners can delete projects
    if (projectUser.role !== 'owner') {
      throw new ForbiddenException('Only project owners can delete projects');
    }

    // Delete the project (cascade will handle project_users)
    await this.projectsRepository.delete(projectId);
    return true;
  }

  async addProjectMember(projectId: string, memberId: string, userId: string): Promise<Project> {
    // Check if user has permission to add members (owner only)
    const projectUser = await this.projectUsersRepository.findOne({
      where: { projectId, userId, isActive: true },
    });

    if (!projectUser || projectUser.role !== 'owner') {
      throw new ForbiddenException('Only project owners can add members');
    }

    // Check if member already exists
    const existingMember = await this.projectUsersRepository.findOne({
      where: { projectId, userId: memberId, isActive: true },
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member of this project');
    }

    // Add the member
    await this.projectUsersRepository.save({
      projectId,
      userId: memberId,
      role: 'member',
      isActive: true,
    });

    // Return the updated project
    const result = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['owner', 'members'],
    });
    
    if (!result) {
      throw new NotFoundException('Project not found');
    }
    
    return result;
  }

  async removeProjectMember(projectId: string, memberId: string, userId: string): Promise<Project> {
    // Check if user has permission to remove members (owner only)
    const projectUser = await this.projectUsersRepository.findOne({
      where: { projectId, userId, isActive: true },
    });

    if (!projectUser || projectUser.role !== 'owner') {
      throw new ForbiddenException('Only project owners can remove members');
    }

    // Check if trying to remove the owner
    const memberToRemove = await this.projectUsersRepository.findOne({
      where: { projectId, userId: memberId, isActive: true },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Member not found in project');
    }

    if (memberToRemove.role === 'owner') {
      throw new ForbiddenException('Cannot remove project owner');
    }

    // Remove the member (soft delete)
    await this.projectUsersRepository.update(
      { projectId, userId: memberId },
      { isActive: false }
    );

    // Return the updated project
    const result = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['owner', 'members'],
    });
    
    if (!result) {
      throw new NotFoundException('Project not found');
    }
    
    return result;
  }

  async checkProjectAccess(projectId: string, userId: string): Promise<boolean> {
    const projectUser = await this.projectUsersRepository.findOne({
      where: { projectId, userId, isActive: true },
    });

    return !!projectUser;
  }

  async checkProjectOwnership(projectId: string, userId: string): Promise<boolean> {
    const projectUser = await this.projectUsersRepository.findOne({
      where: { projectId, userId, isActive: true },
    });

    return projectUser?.role === 'owner';
  }
} 