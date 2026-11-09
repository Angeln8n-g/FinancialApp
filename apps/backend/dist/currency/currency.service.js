"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CurrencyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyService = exports.SUPPORTED_CURRENCIES = void 0;
const common_1 = require("@nestjs/common");
exports.SUPPORTED_CURRENCIES = [
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
const DEFAULT_RATES_FROM_USD = {
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
let CurrencyService = CurrencyService_1 = class CurrencyService {
    logger = new common_1.Logger(CurrencyService_1.name);
    rates = { ...DEFAULT_RATES_FROM_USD };
    lastFetchedAt = null;
    CACHE_TTL_MS = 6 * 60 * 60 * 1000;
    constructor() {
        this.refreshRates().catch((err) => this.logger.warn(`Error al inicializar tasas de cambio: ${err.message}`));
    }
    async refreshRates() {
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
                    for (const curr of exports.SUPPORTED_CURRENCIES) {
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
        }
        catch (err) {
            this.logger.warn(`No se pudo conectar a la API de divisas, usando tasas de respaldo: ${err.message}`);
        }
        return this.rates;
    }
    convert(amount, fromCurrency, toCurrency) {
        if (!amount || amount === 0)
            return 0;
        const from = (fromCurrency || 'USD').toUpperCase();
        const to = (toCurrency || 'USD').toUpperCase();
        if (from === to)
            return amount;
        const rateFrom = this.rates[from] || DEFAULT_RATES_FROM_USD[from] || 1.0;
        const rateTo = this.rates[to] || DEFAULT_RATES_FROM_USD[to] || 1.0;
        const amountInUSD = amount / rateFrom;
        const converted = amountInUSD * rateTo;
        return Math.round(converted * 100) / 100;
    }
    async getExchangeRatesData() {
        await this.refreshRates();
        return {
            base: 'USD',
            lastFetchedAt: this.lastFetchedAt || new Date(),
            rates: this.rates,
            supportedCurrencies: exports.SUPPORTED_CURRENCIES,
        };
    }
    getSupportedCurrencies() {
        return exports.SUPPORTED_CURRENCIES;
    }
};
exports.CurrencyService = CurrencyService;
exports.CurrencyService = CurrencyService = CurrencyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CurrencyService);
//# sourceMappingURL=currency.service.js.map