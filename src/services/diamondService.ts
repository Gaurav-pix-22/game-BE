import { GameCode, SocketEvents,BetStatus } from "../config/constant";
import moment from "moment";
import { Server } from "socket.io";
import Container from "typedi";
import i18next, { use } from "i18next";
import CommonService from "./common";
import { v4 as uuidv4 } from "uuid";
import { Inject, Service } from "typedi";
import userService from "./userService";
import rgsService from "./rgsService";
import gameOutcomes from "./provablyFair/gameOutcomes";
import {
  DiamondBetSessionInterface,
  InitSchemaInterface,
  BetInfo,
} from "./../interfaces/diamond";
import gameConfig from "../config/math/diamond";
import config from "../config";

@Service()
export default class DaimondService extends CommonService {
  constructor(
    @Inject("logger") private logger,
    @Inject("io") private socket: Server,
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
      gameCode: GameCode.DIAMOND,
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
      gameCode: GameCode.DIAMOND,
      paytable: gameConfig[playerInfo.gameMode].multiplierMap,
    };
  }

  public async diamondBet(data: DiamondBetSessionInterface) {
    this.logger.info("===diamondBet started ===");

    const gameOutcomesInstance = Container.get(gameOutcomes);
    const rgsServiceInstance = Container.get(rgsService);

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

    if (!user._id || !user?.hashedServerSeed)
      throw new Error(i18next.t("general.invalidUserSeed"));

    let gemsCount = {}; // It will keep the count of number of occurance of each type of gems
    const generatedTarget = await gameOutcomesInstance.generateGameOutcomes(
      user.serverSeed,
      user.clientSeed,
      user.nonce,
      GameCode.DIAMOND
    );
    const result = generatedTarget.reduce((map, curr) => {
      if (gemsCount[Math.trunc(curr)])
        gemsCount[Math.trunc(curr)] = gemsCount[Math.trunc(curr)] + 1;
      else gemsCount[Math.trunc(curr)] = 1;

      return [...map, gameConfig.colorMap[Math.trunc(curr)]];
    }, []);

    let payout, payoutMultiplier, payoutInfo;

    switch (Object.keys(gemsCount).length) {
      case 5: //All 5 different diamonds
        payoutInfo = gameConfig[data.gameMode].multiplierMap[6];
        break;
      case 1: // All 5 same diamonds
        payoutInfo = gameConfig[data.gameMode].multiplierMap[0];
        break;
      case 4: // 1 pair and 3 different diamonds
        payoutInfo = gameConfig[data.gameMode].multiplierMap[5];
        break;
      case 2: // [3 common and 2 common gems] OR [4 common and 1 different gems]
        payoutInfo = Object.keys(gemsCount)?.find((el) => gemsCount[el] === 4)
          ? gameConfig[data.gameMode].multiplierMap[1]
          : gameConfig[data.gameMode].multiplierMap[2];
        break;
      case 3: // [3 common and 2 different gems] OR [2 pair of common gems and 1 different gems]
        payoutInfo = Object.keys(gemsCount)?.find((el) => gemsCount[el] === 3)
          ? gameConfig[data.gameMode].multiplierMap[3]
          : gameConfig[data.gameMode].multiplierMap[4];
        break;
      default:
    }

    const betId = uuidv4();
    payout = payoutInfo.multiplier * data.betAmount;
    payoutMultiplier = payoutInfo.multiplier;

    await rgsServiceInstance.debit({
      token: data.token,
      playerId: data.userId,
      amount: data.betAmount,
      betId,
      gameCode: GameCode.DIAMOND
    })

    const credResp = await rgsServiceInstance.credit([{
      token: data.token,
      playerId: data.userId,
      amount: payout,
      betId,
      gameCode: GameCode.DIAMOND,
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
      gameCode: GameCode.DIAMOND,
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
        result,
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
      gameCode: GameCode.DIAMOND,
      date: info.date,
    });

    await this.gameModel.create(info);
    await this.userModel.updateOne(
      { _id: user._id },
      { nonce: user.nonce + 1 }
    );

    this.logger.info("===diamondBet ended===");
    return {
      betId,
      diamondState: {
        result,
      },
      payout,
      payoutMultiplier,
      gameCode: GameCode.DIAMOND,
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
        gameCode: GameCode.DIAMOND,
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

    this.logger.info("===getBetInfo ended===");
    return {
      ...resp,
      diamondState: {...resp.state},
      serverSeed: resp.serverSeed === user.serverSeed ? null : resp.serverSeed,
    };
  }
}
