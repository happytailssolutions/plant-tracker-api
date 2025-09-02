import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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

  async findPinsInBounds(
    mapBounds: MapBoundsInput,
    userId: string,
  ): Promise<Pin[]> {
    const { north, south, east, west, projectId } = mapBounds;

    // Build the spatial query using PostGIS ST_MakeEnvelope
    const queryBuilder = this.pinsRepository
      .createQueryBuilder('pin')
      .leftJoinAndSelect('pin.project', 'project')
      .leftJoinAndSelect('pin.createdBy', 'createdBy')
      .where(
        'ST_Intersects(pin.location, ST_MakeEnvelope(:west, :south, :east, :north, 4326))',
        {
          west,
          south,
          east,
          north,
        },
      )
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

      const projectIds = userProjects.map((pu) => pu.projectId);
      queryBuilder.andWhere('pin.projectId IN (:...projectIds)', {
        projectIds,
      });
    }

    // Also include public pins
    queryBuilder.orWhere('pin.isPublic = :isPublic', { isPublic: true });

    return queryBuilder.getMany();
  }

  async findAllPins(userId: string): Promise<Pin[]> {
    // Get all projects user has access to
    const userProjects = await this.projectUsersRepository.find({
      where: { userId, isActive: true },
      select: ['projectId'],
    });

    const projectIds = userProjects.map((pu) => pu.projectId);

    // Build query to get pins from user's projects and public pins
    const queryBuilder = this.pinsRepository
      .createQueryBuilder('pin')
      .leftJoinAndSelect('pin.project', 'project')
      .leftJoinAndSelect('pin.createdBy', 'createdBy')
      .where('pin.isActive = :isActive', { isActive: true });

    if (projectIds.length > 0) {
      queryBuilder.andWhere(
        '(pin.projectId IN (:...projectIds) OR pin.isPublic = :isPublic)',
        {
          projectIds,
          isPublic: true,
        },
      );
    } else {
      // If user has no projects, only show public pins
      queryBuilder.andWhere('pin.isPublic = :isPublic', { isPublic: true });
    }

    return queryBuilder.orderBy('pin.createdAt', 'DESC').getMany();
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

  async createPin(
    createPinInput: CreatePinInput,
    userId: string,
  ): Promise<Pin> {
    // Validate coordinates
    if (
      typeof createPinInput.latitude !== 'number' ||
      typeof createPinInput.longitude !== 'number'
    ) {
      throw new Error(
        'Invalid coordinates: latitude and longitude must be numbers',
      );
    }

    if (createPinInput.latitude === 0 && createPinInput.longitude === 0) {
      throw new Error(
        'Invalid coordinates: cannot create pin at coordinates (0, 0)',
      );
    }

    // Check if user has access to the project
    const projectAccess = await this.projectUsersRepository.findOne({
      where: { projectId: createPinInput.projectId, userId, isActive: true },
    });

    if (!projectAccess) {
      throw new ForbiddenException('Access denied to this project');
    }

    // Create the pin using raw SQL to properly handle PostGIS geography

    const result = await this.pinsRepository.query(
      `
      INSERT INTO pins (
        name, description, location, latitude, longitude, 
        "pinType", status, metadata, "isPublic", "isActive", 
        "projectId", "createdById", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, ST_GeogFromText($3), $4, $5, 
        $6, $7, $8, $9, $10, 
        $11, $12, NOW(), NOW()
      ) RETURNING id
    `,
      [
        createPinInput.name,
        createPinInput.description || null,
        `POINT(${createPinInput.longitude} ${createPinInput.latitude})`,
        createPinInput.latitude,
        createPinInput.longitude,
        createPinInput.pinType || 'plant',
        createPinInput.status || 'active',
        createPinInput.metadata
          ? JSON.stringify(createPinInput.metadata)
          : null,
        createPinInput.isPublic || false,
        true, // isActive
        createPinInput.projectId,
        userId,
      ],
    );

    const pinId = result[0]?.id;
    if (!pinId) {
      throw new Error('Failed to create pin - no ID returned');
    }

    // Return the pin with relations
    const savedPin = await this.pinsRepository.findOne({
      where: { id: pinId },
      relations: ['project', 'createdBy'],
    });

    if (!savedPin) {
      throw new NotFoundException('Failed to create pin');
    }

    return savedPin;
  }

  async updatePin(
    updatePinInput: UpdatePinInput,
    userId: string,
  ): Promise<Pin> {
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
    const updatePayload: Partial<Omit<UpdatePinInput, 'id'>> = {
      ...updateData,
    };

    // Update location if coordinates changed
    if (updateData.latitude && updateData.longitude) {
      // Use raw SQL to update the PostGIS geography column
      await this.pinsRepository.query(
        `
        UPDATE pins 
        SET location = ST_GeogFromText($1), 
            latitude = $2, 
            longitude = $3,
            "updatedAt" = NOW()
        WHERE id = $4
      `,
        [
          `POINT(${updateData.longitude} ${updateData.latitude})`,
          updateData.latitude,
          updateData.longitude,
          id,
        ],
      );
    } else {
      // Update other fields without location
      await this.pinsRepository.update(id, updatePayload);
    }

    // Return the updated pin
    const updatedPin = await this.pinsRepository.findOne({
      where: { id },
      relations: ['project', 'createdBy'],
    });

    if (!updatedPin) {
      throw new NotFoundException('Pin not found after update');
    }

    return updatedPin;
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
