import { GameCode, SocketEvents, BetStatus } from "../config/constant";
import { Server } from "socket.io";
import NodeCache from "node-cache";
import Container from "typedi";
import i18next, { use } from "i18next";
import CommonService from "./common";
import { v4 as uuidv4 } from "uuid";
import { Inject, Service } from "typedi";
import gameOutcomes from "./provablyFair/gameOutcomes";
import {
  LimboBetSessionInterface,
  InitSchemaInterface,
  BetInfo,
  LimboGameStateInterface
} from "./../interfaces/limbo";
import userService from "./userService";
import rgsService from "./rgsService";
import gameConfig from "../config/math/limbo";

@Service()
export default class LimboService extends CommonService {
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
      gameCode: GameCode.LIMBO,
    });

    const isExistingUser = await this.userModel.exists({userId: playerInfo.playerId});

    if (!isExistingUser) {
      this.logger.info(
        "===creating user record for user id %s ===",
        playerInfo.playerId
      );

      await userServiceInstance.createNewUser({
        userId: playerInfo.playerId,
        token: data.token,
        clientSeed: playerInfo.playerId.slice(0, 10),
      });
    }

    this.logger.info("===getUserSession ended===");
    return {...playerInfo, gameCode: GameCode.LIMBO };
  }

  public async limboBet(data: LimboBetSessionInterface) {
    this.logger.info("===limboBet started ===");

    if(data.targetMultiplier < 1.01 || data.targetMultiplier > 1000000)
     throw new Error(i18next.t('limbo.invalidTarget'));
    
    const gameOutcomesInstance = Container.get(gameOutcomes);
    const rgsServiceInstance = Container.get(rgsService);

    const user = await this.userModel.findOne({userId: data.userId}).select({_id: 1, serverSeed: 1,clientSeed: 1, hashedServerSeed: 1, nonce: 1}).lean();
    
    if(!user._id || !user?.hashedServerSeed) 
      throw new Error(i18next.t('general.invalidUserSeed'));

    const generatedTarget = await gameOutcomesInstance.generateGameOutcomes(user.serverSeed, user.clientSeed, user.nonce, GameCode.LIMBO);
    let outcome = Math.trunc(generatedTarget[0]*100)/100;
    outcome = outcome < 1 ? 1 : outcome;

    const betId = uuidv4();
    const payout =
      data.targetMultiplier <= outcome
        ? data.targetMultiplier * data.betAmount
        : 0;
    const payoutMultiplier =
      data.targetMultiplier <= outcome ? data.targetMultiplier : 0;

      await rgsServiceInstance.debit({
        token: data.token,
        playerId: data.userId,
        amount: data.betAmount,
        betId,
        gameCode: GameCode.LIMBO
      })
  
      const credResp = await rgsServiceInstance.credit([{
        token: data.token,
        playerId: data.userId,
        amount: payout,
        betId,
        gameCode: GameCode.LIMBO,
        clientSeed: user.clientSeed,
        serverSeed: user.serverSeed,
        hashedServerSeed: user.hashedServerSeed,
        nonce: user.nonce,
        payoutMultiplier
      }])
      const {balance} = credResp[0];
      if(credResp[0]?.error) throw new Error(credResp[0]?.description || "credit internal error")

    const info = {
      token: data.token,
      gameCode: GameCode.LIMBO,
      gameMode: data.gameMode,
      userId: data.userId,
      currency: data.currency,
      betAmount: data.betAmount,
      clientSeed: user.clientSeed,
      serverSeed: user.serverSeed,
      hashedServerSeed: user.hashedServerSeed,
      nonce: user.nonce,
      active: false,
      betId,
      payout,
      payoutMultiplier,
      betStatus: BetStatus.creditSuccess,
      state: {
        targetMultiplier: data.targetMultiplier,
        outcome: generatedTarget[0],
      },
      date: new Date(),
    };

    this.socket.emit(`${data.gameMode}/${SocketEvents.cashedout}`, {
      userId: data.userId,
      betId,
      payout,
      payoutMultiplier,
      balance,
      betAmount: data.betAmount,
      currency: data.currency,
      gameCode: GameCode.LIMBO,
      date: info.date,
    });

    await this.gameModel.create(info);
    await this.userModel.updateOne({_id: user._id}, {nonce: user.nonce + 1})

    this.logger.info("===limboBet ended===");
    return {
      betId,
      limboState: {
        targetMultiplier: data.targetMultiplier,
        outcome: generatedTarget[0],
      },
      payout,
      payoutMultiplier,
      gameCode: GameCode.LIMBO,
      date: info.date,
      balance
    };
  }

  public async getBetInfo(data: BetInfo) {
    this.logger.info("===getBetInfo started for player %s===", data.userId);

    const resp = await this.gameModel
      .findOne({
        // userId: data.userId,
        betId: data.betId,
        gameCode: GameCode.LIMBO,
        gameMode: data.gameMode
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
   
      const user = await this.userModel.findOne({userId: data.userId}).select({serverSeed: 1});
   
      this.logger.info("===getBetInfo ended===");
      return {
        ...resp,
        limboState: {...resp.state},
        winChance: (resp.state as LimboGameStateInterface).targetMultiplier/gameConfig[data.gameMode].rtp,
        serverSeed:
          resp.serverSeed === user.serverSeed ? null : resp.serverSeed,
      };
  }
}
