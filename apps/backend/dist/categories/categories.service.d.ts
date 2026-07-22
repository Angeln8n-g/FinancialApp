import { PrismaService } from '../prisma/prisma.service';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllByHousehold(householdId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        householdId: string | null;
        icon: string;
        color: string;
    }[]>;
}
