import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    private hashPassword;
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
    getMe(userId: string, householdId: string): Promise<{
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
