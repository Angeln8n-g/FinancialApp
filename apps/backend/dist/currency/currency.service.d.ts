export interface CurrencyMeta {
    code: string;
    name: string;
    symbol: string;
    flag: string;
}
export declare const SUPPORTED_CURRENCIES: CurrencyMeta[];
export declare class CurrencyService {
    private readonly logger;
    private rates;
    private lastFetchedAt;
    private readonly CACHE_TTL_MS;
    constructor();
    refreshRates(): Promise<Record<string, number>>;
    convert(amount: number, fromCurrency: string, toCurrency: string): number;
    getExchangeRatesData(): Promise<{
        base: string;
        lastFetchedAt: Date;
        rates: Record<string, number>;
        supportedCurrencies: CurrencyMeta[];
    }>;
    getSupportedCurrencies(): CurrencyMeta[];
}
