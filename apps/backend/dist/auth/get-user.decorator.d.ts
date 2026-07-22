export declare class UserPayload {
    userId: string;
    email: string;
    fullName: string;
    householdId: string;
    role: string;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
