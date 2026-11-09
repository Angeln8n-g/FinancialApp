import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  async getRates() {
    return this.currencyService.getExchangeRatesData();
  }

  @Get('supported')
  getSupportedCurrencies() {
    return this.currencyService.getSupportedCurrencies();
  }

  @Get('convert')
  convert(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const numAmount = parseFloat(amount) || 0;
    const converted = this.currencyService.convert(numAmount, from || 'USD', to || 'USD');
    return {
      amount: numAmount,
      from: (from || 'USD').toUpperCase(),
      to: (to || 'USD').toUpperCase(),
      converted,
    };
  }
}
