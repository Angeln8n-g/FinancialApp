import { CurrencyService } from './currency.service';
export declare class CurrencyController {
    private readonly currencyService;
    constructor(currencyService: CurrencyService);
    getRates(): Promise<{
        base: string;
        lastFetchedAt: Date;
        rates: Record<string, number>;
        supportedCurrencies: import("./currency.service").CurrencyMeta[];
    }>;
    getSupportedCurrencies(): import("./currency.service").CurrencyMeta[];
    convert(amount: string, from: string, to: string): {
        amount: number;
        from: string;
        to: string;
        converted: number;
    };
}
