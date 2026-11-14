import { CategoriesService } from './categories.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(user: UserPayload): Promise<{
        id: string;
        householdId: string | null;
        name: string;
        createdAt: Date;
        icon: string;
        color: string;
    }[]>;
}
