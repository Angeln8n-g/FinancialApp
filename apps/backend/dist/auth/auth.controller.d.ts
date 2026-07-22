import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { UserPayload } from './get-user.decorator';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | null;
            avatarUrl: string | null;
        };
        household: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    }>;
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | null;
        };
        household: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    getMe(user: UserPayload): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string | null;
            avatarUrl: string | null;
        };
        household: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    }>;
}
