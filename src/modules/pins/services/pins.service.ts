import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pin } from '../entities/pin.entity';
import { CreatePinInput, UpdatePinInput, MapBoundsInput } from '../dto';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { ProjectUser } from '../../projects/entities/project-user.entity';

@Injectable()
export class PinsService {
  constructor(
    @InjectRepository(Pin)
    private pinsRepository: Repository<Pin>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(ProjectUser)
    private projectUsersRepository: Repository<ProjectUser>,
  ) {}

  async findPinsInBounds(mapBounds: MapBoundsInput, userId: string): Promise<Pin[]> {
    const { north, south, east, west, projectId } = mapBounds;

    // Build the spatial query using PostGIS ST_MakeEnvelope
    const queryBuilder = this.pinsRepository
      .createQueryBuilder('pin')
      .leftJoinAndSelect('pin.project', 'project')
      .leftJoinAndSelect('pin.createdBy', 'createdBy')
      .where('ST_Intersects(pin.location, ST_MakeEnvelope(:west, :south, :east, :north, 4326))', {
        west,
        south,
        east,
        north,
      })
      .andWhere('pin.isActive = :isActive', { isActive: true });

    // If projectId is specified, filter by project and check access
    if (projectId) {
      // Check if user has access to this project
      const projectAccess = await this.projectUsersRepository.findOne({
        where: { projectId, userId, isActive: true },
      });

      if (!projectAccess) {
        throw new ForbiddenException('Access denied to this project');
      }

      queryBuilder.andWhere('pin.projectId = :projectId', { projectId });
    } else {
      // If no projectId specified, get pins from all projects user has access to
      const userProjects = await this.projectUsersRepository.find({
        where: { userId, isActive: true },
        select: ['projectId'],
      });

      if (userProjects.length === 0) {
        return [];
      }

      const projectIds = userProjects.map(pu => pu.projectId);
      queryBuilder.andWhere('pin.projectId IN (:...projectIds)', { projectIds });
    }

    // Also include public pins
    queryBuilder.orWhere('pin.isPublic = :isPublic', { isPublic: true });

    return queryBuilder.getMany();
  }

  async findPinById(pinId: string, userId: string): Promise<Pin> {
    const pin = await this.pinsRepository.findOne({
      where: { id: pinId, isActive: true },
      relations: ['project', 'createdBy'],
    });

    if (!pin) {
      throw new NotFoundException('Pin not found');
    }

    // Check if user has access to this pin's project
    const projectAccess = await this.projectUsersRepository.findOne({
      where: { projectId: pin.projectId, userId, isActive: true },
    });

    if (!projectAccess && !pin.isPublic) {
      throw new ForbiddenException('Access denied to this pin');
    }

    return pin;
  }

  async findPinsByProject(projectId: string, userId: string): Promise<Pin[]> {
    // Check if user has access to this project
    const projectAccess = await this.projectUsersRepository.findOne({
      where: { projectId, userId, isActive: true },
    });

    if (!projectAccess) {
      throw new ForbiddenException('Access denied to this project');
    }

    return this.pinsRepository.find({
      where: { projectId, isActive: true },
      relations: ['project', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async createPin(createPinInput: CreatePinInput, userId: string): Promise<Pin> {
    // Check if user has access to the project
    const projectAccess = await this.projectUsersRepository.findOne({
      where: { projectId: createPinInput.projectId, userId, isActive: true },
    });

    if (!projectAccess) {
      throw new ForbiddenException('Access denied to this project');
    }

    // Create the pin with PostGIS point
    const pin = new Pin();
    Object.assign(pin, {
      ...createPinInput,
      createdById: userId,
      location: `POINT(${createPinInput.longitude} ${createPinInput.latitude})`,
    });

    const savedPin = await this.pinsRepository.save(pin);

    // Return the pin with relations
    const result = await this.pinsRepository.findOne({
      where: { id: savedPin.id },
      relations: ['project', 'createdBy'],
    });

    if (!result) {
      throw new NotFoundException('Failed to create pin');
    }

    return result;
  }

  async updatePin(updatePinInput: UpdatePinInput, userId: string): Promise<Pin> {
    const { id, ...updateData } = updatePinInput;

    // Check if pin exists and user has access
    const existingPin = await this.pinsRepository.findOne({
      where: { id, isActive: true },
      relations: ['project'],
    });

    if (!existingPin) {
      throw new NotFoundException('Pin not found');
    }

    // Check if user has access to this pin's project
    const projectAccess = await this.projectUsersRepository.findOne({
      where: { projectId: existingPin.projectId, userId, isActive: true },
    });

    if (!projectAccess) {
      throw new ForbiddenException('Access denied to this pin');
    }

    // Prepare update data
    const updatePayload: any = { ...updateData };

    // Update location if coordinates changed
    if (updateData.latitude && updateData.longitude) {
      updatePayload.location = `POINT(${updateData.longitude} ${updateData.latitude})`;
    }

    // Update the pin
    await this.pinsRepository.update(id, updatePayload);

    // Return the updated pin
    const result = await this.pinsRepository.findOne({
      where: { id },
      relations: ['project', 'createdBy'],
    });

    if (!result) {
      throw new NotFoundException('Pin not found after update');
    }

    return result;
  }

  async deletePin(pinId: string, userId: string): Promise<boolean> {
    // Check if pin exists and user has access
    const existingPin = await this.pinsRepository.findOne({
      where: { id: pinId, isActive: true },
      relations: ['project'],
    });

    if (!existingPin) {
      throw new NotFoundException('Pin not found');
    }

    // Check if user has access to this pin's project
    const projectAccess = await this.projectUsersRepository.findOne({
      where: { projectId: existingPin.projectId, userId, isActive: true },
    });

    if (!projectAccess) {
      throw new ForbiddenException('Access denied to this pin');
    }

    // Soft delete by setting isActive to false
    await this.pinsRepository.update(pinId, { isActive: false });
    return true;
  }

  async checkPinAccess(pinId: string, userId: string): Promise<boolean> {
    const pin = await this.pinsRepository.findOne({
      where: { id: pinId, isActive: true },
    });

    if (!pin) {
      return false;
    }

    // Check if user has access to the project
    const projectAccess = await this.projectUsersRepository.findOne({
      where: { projectId: pin.projectId, userId, isActive: true },
    });

    return !!projectAccess || pin.isPublic;
  }
} 