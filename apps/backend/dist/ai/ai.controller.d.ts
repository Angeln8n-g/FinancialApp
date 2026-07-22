import { AiService } from './ai.service';
import { ParseNaturalDto, ProcessOcrDto, ChatRagDto } from './ai.dto';
import { UserPayload } from '../auth/get-user.decorator';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    parseNatural(dto: ParseNaturalDto): Promise<{
        amount: number;
        type: any;
        description: any;
        categoryName: any;
    }>;
    processOcr(dto: ProcessOcrDto): Promise<{
        rawText: string;
        parsed: {
            amount: number;
            type: any;
            description: any;
            categoryName: any;
        };
    }>;
    chatRAG(user: UserPayload, dto: ChatRagDto): Promise<{
        reply: string;
        isOfflineFallback: boolean;
    }>;
    forecastWhatIf(user: UserPayload, body: {
        simulateExpense?: number;
    }): Promise<{
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
