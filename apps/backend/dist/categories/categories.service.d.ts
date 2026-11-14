import { PrismaService } from '../prisma/prisma.service';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllByHousehold(householdId: string): Promise<{
        id: string;
        householdId: string | null;
        name: string;
        createdAt: Date;
        icon: string;
        color: string;
    }[]>;
}
