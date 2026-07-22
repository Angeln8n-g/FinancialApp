import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PatrimonyService } from './patrimony.service';
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
    @Body() body: { name: string; type: string; value: number },
  ) {
    return this.patrimonyService.createAsset(user.householdId, body);
  }

  @Delete('assets/:id')
  async deleteAsset(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.patrimonyService.deleteAsset(user.householdId, id);
  }
}
