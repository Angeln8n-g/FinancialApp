import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import {
  PatrimonyService,
  CreateAssetDto,
  UpdateAssetDto,
  UpdateValuationDto,
} from './patrimony.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/patrimony')
export class PatrimonyController {
  constructor(private readonly patrimonyService: PatrimonyService) {}

  @Get('net-worth')
  async getNetWorth(@CurrentUser() user: UserPayload) {
    return this.patrimonyService.getNetWorth(user.householdId);
  }

  @Post('assets')
  async createAsset(
    @CurrentUser() user: UserPayload,
    @Body() body: CreateAssetDto,
  ) {
    return this.patrimonyService.createAsset(user.householdId, body);
  }

  @Put('assets/:id')
  async updateAsset(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: UpdateAssetDto,
  ) {
    return this.patrimonyService.updateAsset(user.householdId, id, body);
  }

  @Post('assets/:id/valuation')
  async updateAssetValuation(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: UpdateValuationDto,
  ) {
    return this.patrimonyService.updateAssetValuation(user.householdId, id, body);
  }

  @Delete('assets/:id')
  async deleteAsset(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.patrimonyService.deleteAsset(user.householdId, id);
  }

  @Get('assets/:id/valuations')
  async getAssetValuations(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    return this.patrimonyService.getAssetValuations(user.householdId, id);
  }
}
