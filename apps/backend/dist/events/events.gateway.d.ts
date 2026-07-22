import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinHousehold(client: Socket, data: {
        householdId: string;
    }): {
        status: string;
        room: string;
    } | undefined;
    notifyHouseholdChange(householdId: string, entity: string, action: string, userId?: string): void;
}
