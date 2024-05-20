import { Socket } from "socket.io";
import { Container } from "typedi";
import { Logger } from "winston";
import { SocketEvents, SocketHandlers } from "../config/constant";

const chatSocket = (socket: Socket): SocketHandlers => {
  const handler: SocketHandlers = {
    [SocketEvents.balanceUpdateResult]: rgsBalanceUpdate(socket),
  };

  return handler;
};

const handleError = (error, socket: Socket, logger: Logger) => {
  logger.error(error);
  socket.emit("exception", {
    errorMessage: error.message || "Internal error occurred",
  });
};

// Events
const rgsBalanceUpdate =
  (socket: Socket) =>
  async (
    data: {
      transaction_id: string;
      balance: number;
      externalPlayerId: string;
      userId: string;
    }[]
  ) => {
    const logger: Logger = Container.get("logger");
    try {
      for (const info of data) {
        socket
          .to(info.userId)
          .emit(`${info.userId}/${SocketEvents.balanceCredited}`, {
            userId: info.userId,
            balance: info.balance,
            betId: info.transaction_id,
          });
      }
    } catch (error) {
      handleError(error, socket, logger);
    }
  };

export default chatSocket;
