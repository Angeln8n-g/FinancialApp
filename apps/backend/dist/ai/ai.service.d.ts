import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class AiService {
    private configService;
    private prisma;
    private readonly logger;
    private ollamaHost;
    private ollamaModel;
    constructor(configService: ConfigService, prisma: PrismaService);
    private callOllama;
    private fallbackParseText;
    parseNaturalLanguage(text: string): Promise<{
        amount: number;
        type: any;
        description: any;
        categoryName: any;
    }>;
    processOcr(imageBase64: string): Promise<{
        rawText: string;
        parsed: {
            amount: number;
            type: any;
            description: any;
            categoryName: any;
        };
    }>;
    chatRAG(householdId: string, userMessage: string): Promise<{
        reply: string;
        isOfflineFallback: boolean;
    }>;
    forecastWhatIf(householdId: string, simulateExpense?: number): Promise<{
        currentBalance: number;
        simulatedExpense: number;
        monthlyFixedCosts: number;
        forecast: {
            month: string;
            balance: number;
        }[];
        aiAdvice: string;
    }>;
}
