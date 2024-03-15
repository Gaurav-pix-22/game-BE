import { Server } from "socket.io";
import { Logger } from "winston";
import socketIoHandlers from "../socketEventHandler/eventHandlers";

const socketInit = async (httpServer, logger: Logger) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"]
  });

  socketIoHandlers(io, logger);

  return { io }
};

export default socketInit;
