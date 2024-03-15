import { Server } from "socket.io";
import NodeCache from "node-cache";
import Container from "typedi";
import i18next from "i18next";
import CommonService from "./common";
import { v4 as uuidv4 } from "uuid";
import { Inject, Service } from "typedi";
import userService from "./userService";
import rgsService from "./rgsService";
import gameOutcomes from "./provablyFair/gameOutcomes";
import { GameCode, DiceGameConditions, SocketEvents, BetStatus } from "../config/constant";
import {
  DiceRollSessionInterface,
  InitSchemaInterface,
  BetInfo,
  DiceStateInterface
} from "./../interfaces/dice";
import gameConfig from "../config/math/dice";

@Service()
export default class DiceService extends CommonService {
  constructor(
    @Inject("logger") private logger,
    @Inject("io") private socket: Server,
    @Inject("cache") private cache: NodeCache,
    @Inject("gameModel") private gameModel: Models.GameModel,
    @Inject("userModel") private userModel: Models.UserModel
  ) {
    super();
    this.initiatePerformanceLogger();
  }

  public async getUserSession(data: InitSchemaInterface) {
    this.logger.info("===getUserSession started ===");
    const rgsServiceInstance = Container.get(rgsService);
    const userServiceInstance = Container.get(userService);

    let playerInfo = await rgsServiceInstance.validateToken({
      token: data.token,
      gameCode: GameCode.DICE,
    });

    const isExistingUser = await this.userModel.exists({
      userId: playerInfo.playerId,
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
      });
    }

    this.logger.info("===getUserSession ended===");
    return {
      ...playerInfo,
      paytable: gameConfig[playerInfo.gameMode].multiplierMap,
      gameCode: GameCode.DICE,
    };
  }

  public async diceRoll(data: DiceRollSessionInterface) {
    this.logger.info("===diceRoll started ===");

    const gameOutcomesInstance = Container.get(gameOutcomes);
    const rgsServiceInstance = Container.get(rgsService);

    this.startPerformanceLogging();
    const user = await this.userModel
      .findOne({ userId: data.userId })
      .select({
        _id: 1,
        serverSeed: 1,
        clientSeed: 1,
        hashedServerSeed: 1,
        nonce: 1,
      })
      .lean();
      this.endPerformanceLogging("diceRoll: get user details")

    if (!user._id || !user?.hashedServerSeed) {
      throw new Error(i18next.t("general.invalidUserSeed"));
    }

    const generatedTarget = await gameOutcomesInstance.generateGameOutcomes(
      user.serverSeed,
      user.clientSeed,
      user.nonce,
      GameCode.DICE
    );
    const outcome = Math.trunc(generatedTarget[0]) / 100;
    const payoutInfo: {
      outcome: number;
      probabilityUnder: number;
      probabilityOver: number;
      multiplierOver: number;
      multiplierUnder: number;
    } = gameConfig[data.gameMode].multiplierMap.find((el) => el.outcome === data.target);

    const payoutMultiplier =
      outcome > data.target && data.condition === DiceGameConditions.above
        ? payoutInfo.multiplierOver
        : outcome <= data.target && data.condition === DiceGameConditions.below
        ? payoutInfo.multiplierUnder
        : 0;

    const payout =
      (outcome > data.target && data.condition === DiceGameConditions.above) ||
      (outcome <= data.target && data.condition === DiceGameConditions.below)
        ? data.betAmount * payoutMultiplier
        : 0;

    const betId = uuidv4();

    this.startPerformanceLogging();

    await rgsServiceInstance.debit({
      token: data.token,
      playerId: data.userId,
      amount: data.betAmount,
      betId,
      gameCode: GameCode.DICE
    })

    const credResp = await rgsServiceInstance.credit([{
      token: data.token,
      playerId: data.userId,
      amount: payout,
      betId,
      gameCode: GameCode.DICE,
      clientSeed: user.clientSeed,
      serverSeed: user.serverSeed,
      hashedServerSeed: user.hashedServerSeed,
      nonce: user.nonce,
      payoutMultiplier
    }])
    const {balance} = credResp[0];

    if(credResp[0]?.error) throw new Error(credResp[0]?.description || "credit internal error")

    this.endPerformanceLogging("diceRoll: rgs-debit-credit-call")

    const info = {
      token: data.token,
      gameCode: GameCode.DICE,
      gameMode: data.gameMode,
      userId: data.userId,
      currency: data.currency,
      betAmount: data.betAmount,
      clientSeed: user.clientSeed,
      serverSeed: user.serverSeed,
      hashedServerSeed: user.hashedServerSeed,
      nonce: user.nonce,
      betId,
      payout,
      payoutMultiplier,
      active: false,
      betStatus: BetStatus.creditSuccess,
      state: {
        outcome,
        target: data.target,
        condition: data.condition,
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
      gameCode: GameCode.DICE,
      date: info.date,
    });

    this.startPerformanceLogging();
    const res = await this.gameModel.create(info);
    await this.userModel.updateOne(
      { _id: user._id },
      { nonce: user.nonce + 1 }
    );
    this.endPerformanceLogging("diceRoll: user and game update")

    this.logger.info("===diceRoll ended===");
    return {
      id: res._id,
      betId,
      payout,
      payoutMultiplier,
      balance,
      diceState: {
        outcome,
        target: data.target,
        condition: data.condition,
      },
      gameCode: GameCode.DICE,
      date: info.date,
    };
  }

  public async getBetInfo(data: BetInfo) {
    this.logger.info("===getBetInfo started for player %s===", data.userId);

    const resp = await this.gameModel
      .findOne({
        // userId: data.userId,
        betId: data.betId,
        gameCode: data.gameCode,
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
        gameCode: 1,
      })
      .lean();

    if(!resp?._id) {
      throw new Error(i18next.t("general.invalidBetId"));
    }

    const user = await this.userModel
      .findOne({ userId: data.userId })
      .select({ serverSeed: 1 });
    const outcome = gameConfig[data.gameMode].multiplierMap.find(
      (el) => el.outcome === (resp?.state as DiceStateInterface)?.target
    );

    this.logger.info("===getBetInfo ended===");
    return {
      ...resp,
      winChance:
        (resp?.state as DiceStateInterface).condition === DiceGameConditions.above
          ? outcome.probabilityOver
          : outcome.probabilityUnder,
      multiplier:
        (resp?.state as DiceStateInterface).condition === DiceGameConditions.above
          ? outcome.multiplierOver
          : outcome.multiplierUnder,
      serverSeed: resp.serverSeed === user.serverSeed ? null : resp.serverSeed,
      diceState: resp.state
    }
  }
}
