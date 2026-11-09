import { Injectable, Logger } from '@nestjs/common';

export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$', flag: '🇩🇴' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$', flag: '🇲🇽' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$', flag: '🇨🇴' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$', flag: '🇦🇷' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$', flag: '🇨🇱' },
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/', flag: '🇵🇪' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£', flag: '🇬🇧' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', flag: '🇧🇷' },
  { code: 'CAD', name: 'Dólar Canadiense', symbol: '$', flag: '🇨🇦' },
  { code: 'USDT', name: 'Tether (USD)', symbol: '₮', flag: '🪙' },
];

const DEFAULT_RATES_FROM_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  DOP: 60.5,
  MXN: 18.5,
  COP: 4200.0,
  ARS: 1050.0,
  CLP: 950.0,
  PEN: 3.75,
  GBP: 0.79,
  BRL: 5.6,
  CAD: 1.38,
  USDT: 1.0,
};

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private rates: Record<string, number> = { ...DEFAULT_RATES_FROM_USD };
  private lastFetchedAt: Date | null = null;
  private readonly CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

  constructor() {
    this.refreshRates().catch((err) =>
      this.logger.warn(`Error al inicializar tasas de cambio: ${err.message}`),
    );
  }

  /**
   * Obtiene y actualiza las tasas de cambio desde una API pública gratuita (open.er-api.com o fallback)
   */
  async refreshRates(): Promise<Record<string, number>> {
    const now = new Date();
    if (this.lastFetchedAt && now.getTime() - this.lastFetchedAt.getTime() < this.CACHE_TTL_MS) {
      return this.rates;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          // Actualizar solo las soportadas para mantener memoria ligera
          for (const curr of SUPPORTED_CURRENCIES) {
            if (data.rates[curr.code] !== undefined) {
              this.rates[curr.code] = Number(data.rates[curr.code]);
            }
          }
          this.rates['USD'] = 1.0;
          this.rates['USDT'] = 1.0;
          this.lastFetchedAt = now;
          this.logger.log(`Tasas de cambio actualizadas con éxito desde open.er-api`);
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `No se pudo conectar a la API de divisas, usando tasas de respaldo: ${err.message}`,
      );
    }

    return this.rates;
  }

  /**
   * Convierte un monto de una moneda de origen a una de destino
   */
  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (!amount || amount === 0) return 0;
    const from = (fromCurrency || 'USD').toUpperCase();
    const to = (toCurrency || 'USD').toUpperCase();

    if (from === to) return amount;

    const rateFrom = this.rates[from] || DEFAULT_RATES_FROM_USD[from] || 1.0;
    const rateTo = this.rates[to] || DEFAULT_RATES_FROM_USD[to] || 1.0;

    // Primero convertimos a USD base: amountInUSD = amount / rateFrom
    const amountInUSD = amount / rateFrom;
    // Luego convertimos a destino: result = amountInUSD * rateTo
    const converted = amountInUSD * rateTo;

    return Math.round(converted * 100) / 100;
  }

  /**
   * Retorna las tasas actuales, la fecha de actualización y las monedas soportadas
   */
  async getExchangeRatesData() {
    await this.refreshRates();
    return {
      base: 'USD',
      lastFetchedAt: this.lastFetchedAt || new Date(),
      rates: this.rates,
      supportedCurrencies: SUPPORTED_CURRENCIES,
    };
  }

  getSupportedCurrencies(): CurrencyMeta[] {
    return SUPPORTED_CURRENCIES;
  }
}
