import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('expense-distribution')
  async getExpenseDistribution(@CurrentUser() user: UserPayload) {
    return this.reportsService.getExpenseDistribution(user.householdId);
  }

  @Get('export')
  async exportCsv(@CurrentUser() user: UserPayload, @Res() res: any) {
    const csv = await this.reportsService.generateCsv(user.householdId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=hogariq_transacciones_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  }

  @Get('pdf')
  async getPdfReport(@CurrentUser() user: UserPayload, @Res() res: any) {
    const htmlPdf = await this.reportsService.generatePdfReport(user.householdId);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename=hogariq_informe_${new Date().toISOString().split('T')[0]}.html`);
    return res.send(htmlPdf);
  }
}
