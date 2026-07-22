import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './accounts.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    return this.accountsService.findAllByHousehold(user.householdId);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.accountsService.findOne(user.householdId, id);
  }

  @Post()
  async create(@CurrentUser() user: UserPayload, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(user.householdId, dto);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(user.householdId, id, dto);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.accountsService.delete(user.householdId, id);
  }
}
