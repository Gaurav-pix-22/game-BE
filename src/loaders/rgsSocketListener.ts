import { io as clientIO } from "socket.io-client";
import { Server } from "socket.io";
import { Logger } from "winston";
import config from "../config";
import {SocketEvents} from "../config/constant";

const rgsSocketInit = async (io: Server, logger: Logger) => {
  const socket = clientIO(config.rgsSocketUrl, {path: "/_api/socket.io"}); 

  socket.on("connect", () => {
    logger.info(`✌️ RGS socket listener connected`);
    // Now you can emit and receive events
  });

  socket.on("BALANCE_UPDATE_RESULT", (data) => {
    const info = JSON.parse(data);
    // logger.info(`BALANCE_UPDATE_RESULT: for user %s`, info?.user_id);
    
    io.to(info?.user_id).emit(`${info?.user_id}/${SocketEvents.balanceCredited}`, {userId: info?.user_id, balance: info?.balance, betId: info?.transactionId})
  });

  socket.on("BALANCE_UPDATE_BET", (data) => {
    const info = JSON.parse(data);
    // logger.info(`BALANCE_UPDATE_BET: for user %s`, info?.user_id);
    
    io.to(info?.user_id).emit(`${info?.user_id}/${SocketEvents.balanceDebit}`, {userId: info?.user_id, balance: info?.balance, betId: info?.transactionId})
  });

  return {socket}
};

export default rgsSocketInit;
