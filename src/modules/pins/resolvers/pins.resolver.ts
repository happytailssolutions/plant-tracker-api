import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { PinsService } from '../services/pins.service';
import { Pin } from '../entities/pin.entity';
import { CreatePinInput, UpdatePinInput, MapBoundsInput } from '../dto';

@Resolver(() => Pin)
export class PinsResolver {
  constructor(private pinsService: PinsService) {}

  @Query(() => [Pin])
  @UseGuards(GqlAuthGuard)
  async pinsInBounds(
    @Args('mapBounds') mapBounds: MapBoundsInput,
    @CurrentUser() user: any,
  ): Promise<Pin[]> {
    return this.pinsService.findPinsInBounds(mapBounds, user.sub);
  }

  @Query(() => Pin)
  @UseGuards(GqlAuthGuard)
  async pin(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any,
  ): Promise<Pin> {
    return this.pinsService.findPinById(id, user.sub);
  }

  @Query(() => [Pin])
  @UseGuards(GqlAuthGuard)
  async pinsByProject(
    @Args('projectId', { type: () => ID }) projectId: string,
    @CurrentUser() user: any,
  ): Promise<Pin[]> {
    return this.pinsService.findPinsByProject(projectId, user.sub);
  }

  @Mutation(() => Pin)
  @UseGuards(GqlAuthGuard)
  async createPin(
    @Args('input') createPinInput: CreatePinInput,
    @CurrentUser() user: any,
  ): Promise<Pin> {
    return this.pinsService.createPin(createPinInput, user.sub);
  }

  @Mutation(() => Pin)
  @UseGuards(GqlAuthGuard)
  async updatePin(
    @Args('input') updatePinInput: UpdatePinInput,
    @CurrentUser() user: any,
  ): Promise<Pin> {
    return this.pinsService.updatePin(updatePinInput, user.sub);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deletePin(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    return this.pinsService.deletePin(id, user.sub);
  }
} 