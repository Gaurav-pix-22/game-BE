import { Server } from "socket.io";
import Container from "typedi";
import i18next from "i18next";
import CommonService from "./common";
import { v4 as uuidv4 } from "uuid";
import { Inject, Service } from "typedi";
import gameOutcomes from "./provablyFair/gameOutcomes";
import {
  BetSessionInterface,
  InitSchemaInterface,
  NextCardInterface,
  CashoutInterface,
  card,
  round,
  BetInfo,
  gameState,
} from "../interfaces/hilo";
import { UserDBGameSessionInterface } from "../interfaces/common";
import {
  GameCode,
  HiloGameConditions,
  SocketEvents,
  CardRank,
  BetStatus,
} from "../config/constant";
import userService from "./userService";
import rgsService from "./rgsService";
import gameConfig from "../config/math/hilo";

@Service()
export default class HiloService extends CommonService {
  constructor(
    @Inject("logger") private logger,
    @Inject("io") private socket: Server,
    @Inject("gameModel") private gameModel: Models.GameModel,
    @Inject("userModel") private userModel: Models.UserModel
  ) {
    super();
  }

  public async getUserSession(data: InitSchemaInterface) {
    this.logger.info("===Hilo: getUserSession started ===");
    const rgsServiceInstance = Container.get(rgsService);
    const userServiceInstance = Container.get(userService);

    let playerInfo = await rgsServiceInstance.validateToken({
      token: data.token,
      gameCode: GameCode.HILO,
    });

    let activeBet: UserDBGameSessionInterface;

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

    if (isExistingUser) {
      this.logger.info(
        "===Hilo: getUserSession: getting active bet for user %s===",
        playerInfo.playerId
      );
      activeBet = await this.gameModel
        .findOne({
          userId: playerInfo.playerId,
          active: true,
          gameCode: GameCode.HILO,
          gameMode: playerInfo.gameMode,
        })
        .select({
          betId: 1,
          state: 1,
          payout: 1,
          payoutMultiplier: 1,
          betAmount: 1,
          active: 1,
        })
        .lean();
    }

    this.logger.info("===Hilo: getUserSession ended===");
    return {
      ...playerInfo,
      paytable: gameConfig[playerInfo.gameMode].multiplierMap,
      gameCode: GameCode.HILO,
      activeBet:
        activeBet && Object.keys(activeBet)?.length > 0
          ? { ...activeBet, hiloState: { ...activeBet.state } }
          : {},
    };
  }

  public async updatePlaysession(data: NextCardInterface) {
    this.logger.info(
      "===Hilo: updatePlaysession started for user %s===",
      data.userId
    );
    const session: UserDBGameSessionInterface = await this.gameModel
      .findOne({ userId: data.userId, betId: data.betId, active: true })
      .select({
        state: 1,
        betAmount: 1,
        date: 1,
        gameMode: 1,
      })
      .lean();

    if (!session?._id) {
      throw new Error(i18next.t("hilo.invalidBet"));
    }

    if (
      data.guess === HiloGameConditions.skip &&
      (session?.state as gameState)?.rounds?.filter(
        (el) => el.guess === HiloGameConditions.skip
      )?.length >= 52
    ) {
      throw new Error(i18next.t("hilo.invalidSkip"));
    }

    let updatedSession: UserDBGameSessionInterface;
    let isFailedGuess: Boolean = false;
    let isSkippedGuess: Boolean = false;
    let lastCard: card;
    let lastRound: round = (session?.state as gameState)?.rounds
      ?.slice(-1)
      .pop();
    let expectedOucome = (session.state as gameState).outcome[
      (session.state as gameState).rounds.length
    ];

    if (!lastRound?.payoutMultiplier) {
      this.logger.info(
        "===Hilo: no proper round played by user %s===",
        data.userId
      );
      lastCard = { ...(session?.state as gameState)?.startCard };
    } else {
      this.logger.info(
        "===Hilo: last round info played by user %s===",
        JSON.stringify(lastRound)
      );
      lastCard = { ...lastRound.card };
    }

    if (
      (lastCard.rank === CardRank.ACE &&
        ![HiloGameConditions.high, HiloGameConditions.same]) ||
      (lastCard.rank === CardRank.KING &&
        ![HiloGameConditions.low, HiloGameConditions.same])
    ) {
      throw new Error(i18next.t("hilo.invalidGuess"));
    }

    switch (data.guess) {
      case HiloGameConditions.low:
        isFailedGuess =
          gameConfig.rankValue[lastCard?.rank] <= expectedOucome.rankValue;
        break;
      case HiloGameConditions.high:
        isFailedGuess =
          gameConfig.rankValue[lastCard?.rank] >= expectedOucome.rankValue;
        break;
      case HiloGameConditions.same:
        isFailedGuess =
          gameConfig.rankValue[lastCard?.rank] !== expectedOucome.rankValue;
        break;
      case HiloGameConditions.higherEqual:
        isFailedGuess =
          gameConfig.rankValue[lastCard?.rank] > expectedOucome.rankValue
            ? true
            : false;
        break;
      case HiloGameConditions.lowerEqual:
        isFailedGuess =
          gameConfig.rankValue[lastCard?.rank] < expectedOucome.rankValue
            ? true
            : false;
        break;
      case HiloGameConditions.skip:
        isSkippedGuess = true;
        break;
    }

    let _lastCardPayoutInfo = gameConfig[session.gameMode].multiplierMap.find(
      (el) => lastCard.rank === el.rank
    );

    let _payoutMultiplier =
      data.guess === HiloGameConditions.higherEqual ||
      // (lastCard.rank === CardRank.ACE &&
      //   data.guess === HiloGameConditions.same) ||
      (lastCard.rank === CardRank.KING &&
        data.guess === HiloGameConditions.same)
        ? _lastCardPayoutInfo.multiplierHigh *
          (lastRound?.payoutMultiplier || 1)
        : _lastCardPayoutInfo.multiplierLow *
          (lastRound?.payoutMultiplier || 1);

    if (isFailedGuess) {
      updatedSession = {
        ...session.state,
        //@ts-ignore
        rounds: [
          ...(session.state as gameState).rounds,
          {
            card: {
              suit: expectedOucome.card.split("-")[1],
              rank: expectedOucome.card.split("-")[0],
            },
            guess: data.guess,
            payoutMultiplier: 0,
          },
        ],
      };
    } else if (isSkippedGuess) {
      updatedSession = {
        ...session.state,
        //@ts-ignore
        rounds: [
          ...(session.state as gameState).rounds,
          {
            card: {
              suit: expectedOucome.card.split("-")[1],
              rank: expectedOucome.card.split("-")[0],
            },
            guess: data.guess,
            payoutMultiplier: lastRound?.payoutMultiplier || 0.99,
          },
        ],
      };
    } else {
      updatedSession = {
        ...session.state,
        //@ts-ignore
        rounds: [
          ...(session.state as gameState).rounds,
          {
            card: {
              suit: expectedOucome.card.split("-")[1],
              rank: expectedOucome.card.split("-")[0],
            },
            guess: data.guess,
            payoutMultiplier: _payoutMultiplier,
          },
        ],
      };
    }

    await this.gameModel.findOneAndUpdate(
      { _id: session._id },
      { state: { ...updatedSession } }
    );

    if (
      (updatedSession?.state as gameState)?.rounds?.length >= 104 ||
      isFailedGuess
    ) {
      this.logger.info(
        "===Hilo: max prediction done by the user or wrong prediction being made hence cashing out==="
      );

      return await this.cashOut({
        token: data.token,
        gameCode: GameCode.HILO,
        gameMode: session.gameMode,
        userId: data.userId,
        betId: data.betId,
        platformId: data.platformId,
        operatorId: data.operatorId,
        brandId: data.brandId,
      });
    }

    this.logger.info("===Hilo: updatePlaysession ended===");
    return {
      gameCode: GameCode.HILO,
      betId: data.betId,
      hiloState: { ...updatedSession },
      betAmount: session.betAmount,
      date: session.date,
      active: !isFailedGuess,
      payout: 0,
      payoutMultiplier: 0,
    };
  }

  public async betPlace(data: BetSessionInterface) {
    this.logger.info("===Hilo: betPlace started for user %s===", data.userId);

    const gameOutcomesInstance = Container.get(gameOutcomes);
    const rgsServiceInstance = Container.get(rgsService);

    const user = await this.userModel
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
    const isActiveBet = await this.gameModel.exists({
      userId: data.userId,
      platformId: data?.platformId,
      operatorId: data?.operatorId,
      brandId: data?.brandId,
      active: true,
      gameCode: GameCode.HILO,
      gameMode: data.gameMode,
    });

    if (!user._id || !user?.hashedServerSeed) {
      throw new Error(i18next.t("general.invalidUserSeed"));
    }

    if (isActiveBet) {
      throw new Error(i18next.t("hilo.activeBet"));
    }

    if (
      (data.card.rank === CardRank.ACE &&
        ![HiloGameConditions.high, HiloGameConditions.same]) ||
      (data.card.rank === CardRank.KING &&
        ![HiloGameConditions.low, HiloGameConditions.same])
    ) {
      throw new Error(i18next.t("hilo.invalidGuess"));
    }

    const generatedTarget = await gameOutcomesInstance.generateGameOutcomes(
      user.serverSeed,
      user.clientSeed,
      user.nonce,
      GameCode.HILO
    );

    const outcome = generatedTarget.reduce((map, curr) => {
      let card = gameConfig.suitOrder[Math.floor(curr)];

      let _map = {
        index: Math.floor(curr),
        card,
        rankValue: gameConfig.rankValue[card.split("-")[0]],
      };

      return [...map, { ..._map }];
    }, []);
    const betId = uuidv4();

    const { balance } = await rgsServiceInstance.debit({
      token: data.token,
      playerId: data.userId,
      amount: data.betAmount,
      betId,
      gameCode: GameCode.HILO,
    });

    await this.gameModel.create({
      userId: data.userId,
      gameCode: GameCode.HILO,
      gameMode: data.gameMode,
      currency: data.currency,
      betAmount: data.betAmount,
      hashedServerSeed: user.hashedServerSeed,
      clientSeed: user.clientSeed,
      serverSeed: user.serverSeed,
      nonce: user.nonce,
      token: data.token,
      betId,
      platformId: data?.platformId,
      operatorId: data?.operatorId,
      brandId: data?.brandId,
      payout: 0,
      payoutMultiplier: 0,
      active: true,
      betStatus: BetStatus.debitSuccess,
      state: {
        rounds: [],
        startCard: data.card,
        outcome,
      },
      date: new Date(),
    });
    await this.userModel.updateOne({ _id: user._id }, { $inc: { nonce: 1 } });

    this.logger.info("===Hilo: betPlace ended===");
    return {
      gameCode: GameCode.HILO,
      betId,
      payout: null,
      payoutMultiplier: null,
      balance,
      hiloState: {
        rounds: [],
        startCard: data.card,
      },
    };
  }

  public async cashOut(data: CashoutInterface) {
    this.logger.info(
      "===Hilo: cashOut started for user id %s and bet id %s ===",
      data.userId,
      data.betId
    );
    const rgsServiceInstance = Container.get(rgsService);

    const session = await this.gameModel
      .findOne({
        userId: data.userId,
        betId: data.betId,
        active: true,
        platformId: data?.platformId,
        operatorId: data?.operatorId,
        brandId: data?.brandId,
      })
      .select({
        state: 1,
        betAmount: 1,
        date: 1,
        currency: 1,
        clientSeed: 1,
        serverSeed: 1,
        hashedServerSeed: 1,
        nonce: 1,
      })
      .lean();

    if (!session?._id) {
      throw new Error(i18next.t("hilo.invalidBet"));
    }

    //Don't allow cashout if user has not played atleast single round
    if (!(session?.state as gameState)?.rounds?.length) {
      throw new Error(i18next.t("hilo.invalidCashout"));
    }

    let lastRound: round = (session?.state as gameState)?.rounds
      ?.slice(-1)
      .pop();

    const credResp = await rgsServiceInstance.credit([
      {
        token: data.token,
        playerId: data.userId,
        amount: session.betAmount * lastRound.payoutMultiplier,
        betId: data.betId,
        gameCode: GameCode.HILO,
        clientSeed: session.clientSeed,
        serverSeed: session.serverSeed,
        hashedServerSeed: session.hashedServerSeed,
        nonce: session.nonce,
        payoutMultiplier: lastRound.payoutMultiplier,
      },
    ]);
    const { balance } = credResp[0];
    if (credResp[0]?.error)
      throw new Error(credResp[0]?.description || "credit internal error");

    await this.gameModel.findByIdAndUpdate(
      { _id: session._id },
      {
        active: false,
        payout: session.betAmount * lastRound.payoutMultiplier,
        payoutMultiplier: lastRound.payoutMultiplier,
        betStatus: BetStatus.creditSuccess,
      }
    );

    this.socket
      .to(`${data.brandId}/${data.gameMode}`)
      .emit(`${SocketEvents.cashedout}`, {
        userId: data.userId,
        betId: data.betId,
        payout: session.betAmount * lastRound.payoutMultiplier,
        payoutMultiplier: lastRound.payoutMultiplier,
        betAmount: session.betAmount,
        balance,
        currency: session.currency,
        gameCode: GameCode.HILO,
        date: session.date,
      });

    this.logger.info("===Hilo: cashOut ended===");
    return {
      gameCode: GameCode.HILO,
      betId: data.betId,
      hiloState: { ...session.state },
      betAmount: session.betAmount,
      date: session.date,
      active: false,
      payout: session.betAmount * lastRound.payoutMultiplier,
      payoutMultiplier: lastRound.payoutMultiplier,
      balance,
    };
  }

  public async getBetInfo(data: BetInfo) {
    this.logger.info("===getBetInfo started for player %s===", data.userId);

    const resp = await this.gameModel
      .findOne({
        // userId: data.userId,
        betId: data.betId,
        gameCode: GameCode.HILO,
        platformId: data?.platformId,
        operatorId: data?.operatorId,
        brandId: data?.brandId,
        gameMode: data.gameMode,
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

    if (!resp?._id) {
      throw new Error(i18next.t("general.invalidBetId"));
    }

    const user = await this.userModel
      .findOne({
        userId: data.userId,
        platformId: data?.platformId,
        operatorId: data?.operatorId,
        brandId: data?.brandId,
      })
      .select({ serverSeed: 1 });

    this.logger.info("===getBetInfo ended===");
    return {
      ...resp,
      hiloState: { ...resp.state },
      serverSeed: resp.serverSeed === user.serverSeed ? null : resp.serverSeed,
    };
  }
}
