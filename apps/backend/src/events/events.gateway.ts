import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_household')
  handleJoinHousehold(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { householdId: string },
  ) {
    if (data && data.householdId) {
      const roomName = `household:${data.householdId}`;
      client.join(roomName);
      this.logger.log(`Client ${client.id} joined room ${roomName}`);
      return { status: 'joined', room: roomName };
    }
  }

  notifyHouseholdChange(householdId: string, entity: string, action: string, userId?: string) {
    const roomName = `household:${householdId}`;
    this.server.to(roomName).emit('household_data_changed', {
      entity,
      action,
      userId,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Emitted household_data_changed to room ${roomName}`);
  }
}
