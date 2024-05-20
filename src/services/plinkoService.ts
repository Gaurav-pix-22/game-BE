import { GameCode, SocketEvents, BetStatus } from "../config/constant";
import { Server } from "socket.io";
import NodeCache from "node-cache";
import Container from "typedi";
import i18next, { use } from "i18next";
import CommonService from "./common";
import { v4 as uuidv4 } from "uuid";
import { Inject, Service } from "typedi";
import userService from "./userService";
import rgsService from "./rgsService";
import gameOutcomes from "./provablyFair/gameOutcomes";
import {
  PlinkoBetSessionInterface,
  InitSchemaInterface,
  BetInfo
} from "./../interfaces/plinko";
import {UserInterface} from "../interfaces/userInterface"
import gameConfig from "../config/math/plinko";

@Service()
export default class PlinkoService extends CommonService {
  constructor(
    @Inject("logger") private logger,
    @Inject("io") private socket: Server,
    @Inject("cache") private cache: NodeCache,
    @Inject("gameModel") private gameModel: Models.GameModel,
    @Inject("userModel") private userModel: Models.UserModel
  ) {
    super();
  }

  public async getUserSession(data: InitSchemaInterface) {
    this.logger.info("===getUserSession started ===");
    const rgsServiceInstance = Container.get(rgsService);
    const userServiceInstance = Container.get(userService);

    let playerInfo = await rgsServiceInstance.validateToken({
      token: data.token,
      gameCode: GameCode.PLINKO,
    });

    const isExistingUser = await this.userModel.exists({
      userId: playerInfo.playerId,
      platformId: playerInfo?.platformId,
      operatorId: playerInfo?.operatorId,
      brandId: playerInfo?.brandId,
    });

    if (!isExistingUser) {
      this.logger.info(
        "===creating user record for user id %s ===",
        playerInfo.playerId
      );

      await userServiceInstance.createNewUser({
        userId: playerInfo.playerId,
        token: data.token,
        clientSeed: playerInfo.playerId.slice(0, 10),
        platformId: playerInfo?.platformId,
        operatorId: playerInfo?.operatorId,
        brandId: playerInfo?.brandId,
        avtar: "av1",
      });
    }

    let user = await this.userModel.findOne({userId: playerInfo.playerId}).select({_id: 1, serverSeed: 1,clientSeed: 1, hashedServerSeed: 1, nonce: 1}).lean();
    this.cache.set(`${GameCode.PLINKO}/user/${playerInfo.playerId}`, { ...user }, 60);

    this.logger.info("===getUserSession ended===");
    return {...playerInfo, gameCode: GameCode.PLINKO, paytableByLevels: gameConfig[playerInfo.gameMode].gameLevel };
  }

  public async plinkoBet(data: PlinkoBetSessionInterface) {
    this.logger.info("===plinkoBet started ===");
    
    const gameOutcomesInstance = Container.get(gameOutcomes);
    const rgsServiceInstance = Container.get(rgsService);
    let user: UserInterface = this.cache.get(`${GameCode.PLINKO}/user/${data.userId}`);

    if(!user)
      user = await this.userModel
        .findOne({
          userId: data.userId,
          platformId: data?.platformId,
          operatorId: data?.operatorId,
          brandId: data?.brandId,
        })
        .select({
          _id: 1,
          serverSeed: 1,
          clientSeed: 1,
          hashedServerSeed: 1,
          nonce: 1,
        })
        .lean();
    
    this.cache.set(`${GameCode.PLINKO}/user/${data.userId}`, {...user, nonce: user.nonce + 1}, 60);
    
    if(!user._id || !user?.hashedServerSeed) 
      throw new Error(i18next.t('general.invalidUserSeed'));

    const generatedTarget = await gameOutcomesInstance.generateGameOutcomes(user.serverSeed, user.clientSeed, user.nonce, GameCode.PLINKO);
    const path = generatedTarget.map((el) => !!Math.trunc(el) ? "R" : "L").slice(0, data.rows);
    const payInfo = gameConfig[data.gameMode].gameLevel[data.risk.toLowerCase()].find(el => el.row === data.rows).multiplierMap[path.filter(el => el === "R").length]

    const betId = uuidv4();
    const payout = payInfo.multiplier * data.betAmount;
    const payoutMultiplier = payInfo.multiplier;
    this.initiatePerformanceLogger()

    this.startPerformanceLogging()
    const debitResp = await rgsServiceInstance.debit({
      token: data.token,
      playerId: data.userId,
      amount: data.betAmount,
      betId,
      gameCode: GameCode.PLINKO
    })
    this.endPerformanceLogging("PLINKO: rgs debit call end")

    this.startPerformanceLogging()
    const credResp = await rgsServiceInstance.credit([{
      token: data.token,
      playerId: data.userId,
      amount: payout,
      betId,
      gameCode: GameCode.PLINKO,
      clientSeed: user.clientSeed,
      serverSeed: user.serverSeed,
      hashedServerSeed: user.hashedServerSeed,
      nonce: user.nonce,
      payoutMultiplier
    }])
    this.endPerformanceLogging("PLINKO: rgs credit call end")
    
    if(credResp[0]?.error) {
      this.cache.set(`${GameCode.PLINKO}/user/${data.userId}`, {...user, nonce: user.nonce}, 60);
      throw new Error(credResp[0]?.description || "credit internal error")
    };
    
    const {balance} = credResp[0];
    const balanceBefore = debitResp?.balance || 0;

    const info = {
      token: data.token,
      gameCode: GameCode.PLINKO,
      gameMode: data.gameMode,
      userId: data.userId,
      currency: data.currency,
      betAmount: data.betAmount,
      clientSeed: user.clientSeed,
      serverSeed: user.serverSeed,
      hashedServerSeed: user.hashedServerSeed,
      nonce: user.nonce,
      betId,
      platformId: data?.platformId,
      operatorId: data?.operatorId,
      brandId: data?.brandId,
      payout,
      payoutMultiplier,
      active: false,
      betStatus: BetStatus.creditSuccess,
      state: {
        path,
        risk: data.risk,
        rows: data.rows
      },
      date: new Date(),
    };

    this.socket.to(`${data.brandId}/${data.gameMode}`).emit(`${SocketEvents.cashedout}`, {
      userId: data.userId,
      betId,
      payout,
      payoutMultiplier,
      balance,
      betAmount: data.betAmount,
      currency: data.currency,
      gameCode: GameCode.PLINKO,
      date: info.date,
    });

    await this.userModel.updateOne({_id: user._id}, {nonce: user.nonce + 1})
    await this.gameModel.create(info);

    this.logger.info("===plinkoBet ended===");
    return {
      betId,
      plinkoState: {
        path,
        risk: data.risk,
        rows: data.rows
      },
      payout,
      payoutMultiplier,
      gameCode: GameCode.PLINKO,
      date: info.date,
      balance,
      balanceBefore
    };
  }

  public async getBetInfo(data: BetInfo) {
    this.logger.info("===getBetInfo started for player %s===", data.userId);

    console.log({
      // userId: data.userId,
      betId: data.betId,
      gameCode: GameCode.PLINKO,
      gameMode: data.gameMode,
      platformId: data?.platformId,
      operatorId: data?.operatorId,
      brandId: data?.brandId,
    })

    const resp = await this.gameModel
      .findOne({
        // userId: data.userId,
        betId: data.betId,
        gameCode: GameCode.PLINKO,
        gameMode: data.gameMode,
        platformId: data?.platformId,
        operatorId: data?.operatorId,
        brandId: data?.brandId,
      })
      .select({
        userId: 1,
        currency: 1,
        betAmount: 1,
        betId: 1,
        payout: 1,
        payoutMultiplier: 1,
        date: 1,
        state: 1,
        clientSeed: 1,
        serverSeed: 1,
        hashedServerSeed: 1,
        nonce: 1,
        gameCode: 1
      })
      .lean();

      if(!resp?._id) {
        throw new Error(i18next.t("general.invalidBetId"));
      }
   
      const user = await this.userModel.findOne({userId: data.userId, platformId: data?.platformId,
        operatorId: data?.operatorId,
        brandId: data?.brandId,}).select({serverSeed: 1});
   
      this.logger.info("===getBetInfo ended===");
      return {
        ...resp,
        plinkoState: resp.state,
        serverSeed:
          resp.serverSeed === user.serverSeed ? null : resp.serverSeed,
      };
  }
}
