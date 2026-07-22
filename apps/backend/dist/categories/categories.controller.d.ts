import { CategoriesService } from './categories.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(user: UserPayload): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        householdId: string | null;
        icon: string;
        color: string;
    }[]>;
}
