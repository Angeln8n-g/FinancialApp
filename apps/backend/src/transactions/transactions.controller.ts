import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './transactions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    return this.transactionsService.findAllByHousehold(user.householdId);
  }

  @Get('summary')
  async getSummary(@CurrentUser() user: UserPayload) {
    return this.transactionsService.getSummary(user.householdId);
  }

  @Post()
  async create(@CurrentUser() user: UserPayload, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(user.householdId, dto);
  }

  @Post('import')
  async importBankStatement(@CurrentUser() user: UserPayload, @Body() body: { rawContent: string }) {
    return this.transactionsService.importBankStatement(user.householdId, body.rawContent);
  }
}
