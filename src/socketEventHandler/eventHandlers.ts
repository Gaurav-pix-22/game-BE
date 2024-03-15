import { Server, Socket } from "socket.io";
import { Logger } from "winston";
import roomHandlers from "./room";
import { GameCode } from "../config/constant";

//structure refered from following source
//https://stackoverflow.com/questions/20466129/how-to-organize-socket-handling-in-node-js-and-socket-io-app

const main = (io: Server, logger: Logger) => {
  io.on("connection", function (socket) {
    logger.info(`New connection: ${socket.id}`);

    const eventHandlers = [roomHandlers(socket, logger)];

    // Bind events to handlers
    eventHandlers.forEach((handler) => {
      for (const eventName in handler) {
        socket.on(eventName, handler[eventName]);
      }
    });

    socket.on("disconnect", () => {
      logger.info(`Connection left (${socket.id})`);

      const rooms = Object.keys(socket.rooms);
     
      rooms.forEach((room) => {
        logger.info(`Leaving room (${room})`);
        socket.leave(room); // Leave all rooms upon disconnection
      });
    });
  });
};

export default main;
