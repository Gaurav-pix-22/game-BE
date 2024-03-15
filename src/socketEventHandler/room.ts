import { Socket } from "socket.io";
import { Container } from "typedi";
import { Logger } from "winston";
import { SocketEvents } from "../config/constant";

const roomHandlers = (socket: Socket, logger: Logger) => {
  const handler = {
    [SocketEvents.joinRoom]: joinRoom(socket, logger),
    [SocketEvents.leaveRoom]: leaveRoom(socket, logger)
  };

  return handler;
};

const joinRoom =
  (socket: Socket, logger: Logger) =>
  async (data: { roomName: string, userId: string }, cb: (data: any) => any) => {
    try {
      if(data?.roomName) {
        socket.join(data?.roomName)
        socket.to(data?.roomName).emit('message', `Welcome ${data?.userId} to the game room ${data?.roomName}!`);
      }

      if(data?.userId) {
        socket.join(data?.userId)
        socket.to(data?.userId).emit('message', `Welcome ${data?.userId} to user room ${data?.userId}!`);
      }
      
      logger.info(`Player ${data.userId} joined: ${data.roomName}`);
    } catch (error) {
      logger.info(`Player ${data.userId} unable to joined: ${data.roomName}`);
    }
  };


const leaveRoom =
(socket: Socket, logger: Logger) =>
async (data: { roomName: string, userId: string }, cb: (data: any) => any) => {
  try {
    if(data?.roomName) {
      socket.leave(data?.roomName)
      socket.to(data?.roomName).emit('message', `User ${data?.userId} leaves game room ${data?.roomName}!`);
    }

    if(data?.userId) {
      socket.leave(data?.userId)
      socket.to(data?.userId).emit('message', `User ${data?.userId} leaves user room ${data?.userId}!`);
    }
    
    logger.info(`Player ${data.userId} left: ${data.roomName}`);
  } catch (error) {
    logger.info(`Player ${data.userId} unable to left: ${data.roomName}`);
  }
};

export default roomHandlers;
