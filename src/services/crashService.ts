import { Server } from "socket.io";
import NodeCache from "node-cache";
import Container from "typedi";
import mongoose from "mongoose";
import i18next, { use } from "i18next";
import CommonService from "./common";
import { v4 as uuidv4 } from "uuid";
import { Inject, Service } from "typedi";
import gameOutcomes from "./provablyFair/gameOutcomes";
import multiplayerOutcome from "./provablyFair/multiplayerOutcomes";
import {
  CrashBetSessionInterface,
  CrashPlayerStatusInterface,
  InitSchemaInterface,
  WSCrashGameInterface,
  WSCrashPlayersInterface,
  CrashGameCashoutInterface,
  BetInfo,
  PreviousCrashInfo
} from "./../interfaces/crash";
import { GameSeedsInterface } from "../interfaces/common";
import {
  GameCode,
  GameMode,
  SocketEvents,
  MultiPlayerGameStates,
  BetStatus,
} from "../config/constant";
import userService from "./userService";
import rgsService from "./rgsService";

@Service()
export default class CrashService extends CommonService {
  constructor(
    @Inject("logger") private logger,
    @Inject("io") private socket: Server,
    @Inject("cache") private cache: NodeCache,
    @Inject("gameSeeds") private gameSeeds: Models.GameSeedsModel,
    @Inject("gameModel") private gameModel: Models.GameModel,
    @Inject("crashHashModel") private crashHashModel: Models.CrashHashModel,
    @Inject("crashGames") private crashGames: Models.CrashGameModel,
    @Inject("userModel") private userModel: Models.UserModel
  ) {
    super();
  }

  public async _checkAndSettleAutoCashout(
    gameId: string,
    currMultiplier: number
  ) {
    // this.logger.info(
    //   "===CRASH: _checkAndSettleAutoCashout started for game %s===",
    //   gameId
    // );
    let game: WSCrashGameInterface = this.cache.get(
      `${GameCode.CRASH}/${gameId}`
    );

    let _updatedPlayerInfo = {
      [GameMode.ONE]: [],
      [GameMode.TWO]: [],
      [GameMode.THREE]: [],
      [GameMode.FIVE]: [],
      [GameMode.SEVEN]: [],
    };

    //scenario:
    //user want to auto cashout at -> 940 at rtp 2
    // i -> 939 -> 948 [higher jumps];
    // 2rtp -> 940
    // 5rtp -> 1000
    for (const _gameMode of Object.keys(game.players)) {
      let _players: WSCrashPlayersInterface[] = game.players[_gameMode];
      let _crashMultiplierByRTP = game.crashMultiplier[_gameMode];

      for (const info of _players) {
        let playerInfo;
        if (
          info.betStatus === BetStatus.debitSuccess &&
          currMultiplier > _crashMultiplierByRTP
        ) {
          playerInfo = {
            ...info,
            payout:
              info.crashState.cashOutAt <= _crashMultiplierByRTP
                ? info.betAmount * info.crashState.cashOutAt
                : 0,
            payoutMultiplier:
              info.crashState.cashOutAt <= _crashMultiplierByRTP
                ? info.crashState.cashOutAt
                : 0,
            betStatus: info.crashState.cashOutAt <= _crashMultiplierByRTP ? BetStatus.creditSuccess : BetStatus.debitSuccess,
          };

          info.crashState.cashOutAt <= _crashMultiplierByRTP &&
            this.socket.to(`${info.brandId}/${info.gameMode}`).emit(
              `${SocketEvents.cashedout}`,
              {...playerInfo, isRoundEnd: false}
            );
        } else if (
          info.betStatus === BetStatus.debitSuccess &&
          currMultiplier > info.crashState.cashOutAt &&
          currMultiplier < _crashMultiplierByRTP
        ) {
          playerInfo = {
            ...info,
            payout: info.betAmount * info.crashState.cashOutAt,
            payoutMultiplier: info.crashState.cashOutAt,
            betStatus: BetStatus.creditSuccess,
          };

          this.socket.to(`${info.brandId}/${info.gameMode}`).emit(
            `${SocketEvents.cashedout}`,
            {...playerInfo, isRoundEnd: false}
          );
        } else {
          playerInfo = { ...info };
        }

        _updatedPlayerInfo = {
          ..._updatedPlayerInfo,
          [_gameMode]: [..._updatedPlayerInfo[_gameMode], { ...playerInfo }],
        };
      }
    }

    this.cache.set(`${GameCode.CRASH}/${gameId}`, {
      ...game,
      players: { ..._updatedPlayerInfo },
    });

    // this.logger.info("===CRASH: _checkAndSettleAutoCashout ended %s===");
  }

  public async _runGame(gameId: string) {
    let game: WSCrashGameInterface = this.cache.get(
      `${GameCode.CRASH}/${gameId}`
    );
    let finalCrashMultiplier = 0; //store max crash here
    const _gameModes = [
      GameMode.ONE,
      GameMode.TWO,
      GameMode.THREE,
      GameMode.FIVE,
      GameMode.SEVEN,
    ];

    for (const _mul of Object.keys(game.crashMultiplier)) {
      if (game.crashMultiplier[_mul] > finalCrashMultiplier)
        finalCrashMultiplier = game.crashMultiplier[_mul];
    }

    this.logger.info("===CRASH: _checkAndSettleAutoCashout will be exceted till game %s crash at %s===", game.id, finalCrashMultiplier);
    
    for (let i = 1, j = 1; i <= finalCrashMultiplier; j++) {
      await this.timer(100);

      for (let temp = 0; temp < _gameModes.length; temp++) {
        let _gameMode = _gameModes[temp]

        game.crashMultiplier[_gameMode] < i
          ? this.socket.to(`${_gameMode}/${GameCode.CRASH}`).emit(
              `${GameCode.CRASH}/${MultiPlayerGameStates.halt}`,
              {
                gameId: game.id,
                status: MultiPlayerGameStates.halt,
                multiplier: game.crashMultiplier[_gameMode],
                isCrashed: true,
                delay: null,
              }
            )
          : this.socket.to(`${_gameMode}/${GameCode.CRASH}`).emit(
              `${GameCode.CRASH}/${MultiPlayerGameStates.running}`,
              {
                gameId: game.id,
                status: game.status,
                multiplier: i,
                isCrashed: false,
                delay: null,
              }
            );
      }

      if (i > 1) {
        this.cache.set(`${GameCode.CRASH}/activeGame`, {
          gameId: game.id,
          multiplier: i,
        });
        this._checkAndSettleAutoCashout(game.id, i);
      }

      let next = Math.pow(1.01, j);
      i = next;

      if (i > finalCrashMultiplier) {
        i = finalCrashMultiplier;
        this.logger.info(
          "===CRASH: game %s has been crashed at %s===",
          game.id,
          finalCrashMultiplier
        );

        //fetch current player info before updating the game status
        game = this.cache.get(
          `${GameCode.CRASH}/${gameId}`
        );

        this.cache.set(`${GameCode.CRASH}/${game.id}`, {
          ...game,
          status: MultiPlayerGameStates.ended,
        });
        this.socket.to(GameCode.CRASH).emit(`${GameCode.CRASH}/${MultiPlayerGameStates.ended}`, {
          gameId: game.id,
          status: MultiPlayerGameStates.ended,
          multiplier: i,
          isCrashed: true,
          delay: 5000,
        });
        break;
      }
    }
  }

  public async _handleGameCrash(gameId: string) {
    this.logger.info(
      "===CRASH: _handleGameCrash started for game %s===",
      gameId
    );
    const rgsServiceInstance = Container.get(rgsService);
    this.initiatePerformanceLogger();
    this.startPerformanceLogging();

    let game: WSCrashGameInterface = this.cache.get(
      `${GameCode.CRASH}/${gameId}`
    );
    let players = [],
      updatedPlayerInfo = [];

    for (const _gameMode of Object.keys(game.players)) {
      players = [...players, ...game.players[_gameMode]];
    }

    let users = await this.userModel
      .find({ userId: { $in: players.map((el) => el.userId) } })
      .select({
        _id: 1,
        serverSeed: 1,
        clientSeed: 1,
        hashedServerSeed: 1,
        nonce: 1,
        userId: 1,
      });
      
    //credit all users payout
    const creditResp = await rgsServiceInstance.credit(
      players.map((info) => {
        let _user = users.find((el) => el.userId === info.userId);
        return {
          token: info.token,
          playerId: info.userId,
          amount: info.payout,
          payoutMultiplier: info.payoutMultiplier,
          betId: info.betId,
          gameCode: GameCode.CRASH,
          clientSeed: _user?.clientSeed || "",
          serverSeed: _user?.serverSeed || "",
          hashedServerSeed: _user?.hashedServerSeed || "",
          nonce: _user?.nonce,
          roundId: game?.round?.toString()
        };
      })
    );

    // let history = [];

    for (let i = 0; i < players.length; i++) {
      let _player: WSCrashPlayersInterface = players[i];
      let _user = users.find((el) => el.userId === _player.userId);
      let _resp = creditResp.find(
        (info) => info?.transaction_id === _player.betId
      );

      this.logger.info(
        "===CRASH: _handleGameCrash -> settling rgs credit for user %s and betId %s===",
        _player.userId, _player.betId
      );

      try {
        if (!_user || !_user._id || !_user?.hashedServerSeed) {
          throw new Error(i18next.t("general.invalidUserSeed"));
        }

        if (_resp?.error)
          throw new Error(_resp?.description || "credit internal error");

        this.socket.to(_player.userId).emit(
          `${_player.userId}/${SocketEvents.balance}`,
          { balance: _resp?.balance, userId: _player.userId }
        );

        if(_player.betStatus === BetStatus.debitSuccess) {
          //Need to trigger cashout for players who lost
          this.socket.to(`${_player.brandId}/${_player.gameMode}`).emit(`${SocketEvents.cashedout}`, {
            gameCode: GameCode.CRASH,
            gameMode: _player.gameMode,
            date: _player.date,
            currency: _player.currency,
            betAmount: _player.betAmount || 0,
            payoutMultiplier: _player?.payoutMultiplier || 0,
            payout: _player?.payout || 0,
            betId: _player?.betId,
            userId: _player?.userId,
            isRoundEnd: true
          });
          // history.push(_player)
        }

        updatedPlayerInfo.push({
          ..._player,
          betStatus: BetStatus.creditSuccess,
        });
      } catch (e) {
        updatedPlayerInfo.push({
          ..._player,
          betStatus: BetStatus.creditFailed,
          err: e?.message || "",
        });
      }
    }

    //update game DB and user game info in bulk
    await this.gameModel.bulkWrite(
      updatedPlayerInfo.reduce((map, curr) => {
        return [
          ...map,
          {
            updateOne: {
              filter: {
                gameId: curr.gameId,
                betId: curr.betId,
                userId: curr.userId,
                gameMode: curr.gameMode,
                gameCode: GameCode.CRASH,
                platformId: curr.platformId,
                operatorId: curr.operatorId,
                brandId: curr.brandId,
              },
              update: {
                $set: {
                  active: false,
                  payout: curr.payout,
                  payoutMultiplier: curr.payoutMultiplier,
                  betStatus: BetStatus.creditSuccess,
                },
              },
            },
          },
        ];
      }, [])
    );
    await this.crashGames.findOneAndUpdate(
      {
        _id: game.id,
      },
      { status: MultiPlayerGameStates.ended }
    );

    this.endPerformanceLogging("CRASH: _handleGameCrash");
    this.logger.info("===CRASH: _handleGameCrash ended %s===");
  }

  public async createGame() {
    this.logger.info("===CRASH: createGame started ===");

    const hashInfo = await this.crashHashModel
      .find({ isUsed: false })
      .sort({ order: -1 })
      .limit(1)
      .lean();

    let seedInfo: GameSeedsInterface;

    if (this.cache.has(`${GameCode.CRASH}/seeds`))
      seedInfo = this.cache.get(`${GameCode.CRASH}/seeds`);
    else {
      this.logger.info("===CRASH: fetching seed ===");
      seedInfo = await this.gameSeeds
        .findOne({ game_code: GameCode.CRASH })
        .select({ seed: 1 })
        .lean();

      this.cache.set(`${GameCode.CRASH}/seeds`, seedInfo);
    }

    if (!hashInfo[0] && !hashInfo[0]?.hash){
      this.socket
      .to(GameCode.CRASH)
      .emit(`${GameCode.CRASH}/${MultiPlayerGameStates.underMaintenance}`, {
        message: "Game under maintainence"
      });

      throw new Error(i18next.t("crash.hashExhausted"));
    }
      

    const gameOutcomesInstance = Container.get(multiplayerOutcome);
    const result = await gameOutcomesInstance.generateGameOutcomes(
      hashInfo[0].hash,
      seedInfo.seed,
      GameCode.CRASH
    );

    //Expire the respective hashcode being used and create a game in DB
    this.logger.info("===CRASH: adding new game===");
    await this.crashHashModel.updateOne({_id: hashInfo[0]._id}, {isUsed: true});
    const gameResp = await this.crashGames.create({
      hashId: hashInfo[0]._id,
      seedId: seedInfo?._id,
      crashMultiplier: { ...result },
      status: MultiPlayerGameStates.scheduled,
      round: hashInfo[0].order,
    });
    this.cache.set(`${GameCode.CRASH}/activeGame`, {
      gameId: gameResp._id,
      multiplier: 1,
    });

    let wsGameResp = {
      id: gameResp._id,
      crashMultiplier: { ...result },
      status: MultiPlayerGameStates.scheduled,
      round: hashInfo[0].order,
      players: {
        [GameMode.ONE]: [],
        [GameMode.TWO]: [],
        [GameMode.THREE]: [],
        [GameMode.FIVE]: [],
        [GameMode.SEVEN]: [],
      },
    };

    //Triggering socket event for new game
    this.socket.to(GameCode.CRASH).emit(`${GameCode.CRASH}/${MultiPlayerGameStates.scheduled}`, {
      gameId: wsGameResp.id,
      status: wsGameResp.status,
    });

    //Triggering socket event for accepting bet and update DB async
    this.cache.set(`${GameCode.CRASH}/${wsGameResp.id}`, {
      ...wsGameResp,
      status: MultiPlayerGameStates.acceptBet,
    });
    this.socket.to(GameCode.CRASH).emit(`${GameCode.CRASH}/${MultiPlayerGameStates.acceptBet}`, {
      gameId: wsGameResp.id,
      status: MultiPlayerGameStates.acceptBet,
      delay: 10000,
    });
    await this.crashGames.updateOne(
      { _id: wsGameResp.id },
      { status: MultiPlayerGameStates.acceptBet }
    );
    this.logger.info(
      "===CRASH: game %s updated to bet accepting state ===",
      gameResp._id
    );
    await this.timer(10000);

    //emit socket event for game starting and move game DB to runing state
    this.cache.set(`${GameCode.CRASH}/${wsGameResp.id}`, {
      ...wsGameResp,
      status: MultiPlayerGameStates.starting,
    });
    this.socket.to(GameCode.CRASH).emit(`${GameCode.CRASH}/${MultiPlayerGameStates.starting}`, {
      gameId: wsGameResp.id,
      status: MultiPlayerGameStates.starting,
      delay: 2000
    });

    await this.timer(2000);

    //update game status to running in DB
    await this.crashGames.findOneAndUpdate(
      { _id: wsGameResp.id },
      { status: MultiPlayerGameStates.running }
    );

    //update cache with players joined the games
    const playerJoined = await this.gameModel.find({gameCode: GameCode.CRASH, gameId: wsGameResp.id}).select({
      gameId: 1,
      token: 1,
      userId: 1,
      betId: 1,
      payout: 1,
      payoutMultiplier: 1,
      betAmount: 1,
      currency: 1,
      gameCode: 1,
      gameMode: 1,
      state: 1,
      betStatus: 1,
      date: 1,
      platformId: 1,
      operatorId: 1,
      brandId: 1
    }).lean()

    for (const info of playerJoined) {
      wsGameResp.players[info.gameMode] = [
        ...wsGameResp.players[info.gameMode],
        {
          ...info,
          crashState: {cashOutAt: (info?.state as CrashPlayerStatusInterface)?.cashOutAt || 0}
        }
      ]
    }

    wsGameResp = {
      ...wsGameResp,
      status: MultiPlayerGameStates.running,
    }

    this.cache.set(`${GameCode.CRASH}/${wsGameResp.id}`, wsGameResp);

    //Update Game to running state in cache
    this.logger.info(
      "===CRASH: game %s updated to running state ===",
      gameResp._id
    );

    await this._runGame(wsGameResp.id);
    await this._handleGameCrash(wsGameResp.id);

    await this.timer(2000);

    //Clear cache for game completed
    this.cache.del([
      `${GameCode.CRASH}/${wsGameResp.id}`,
      `${GameCode.CRASH}/activeGame`,
    ]);
    this.logger.info("===CRASH: createGame ended ===");

    return {
      proceedNext: true,
      message: "",
    };
  }

  public async getUserSession(data: InitSchemaInterface) {
    this.logger.info("===CRASH: getUserSession started ===");
    const rgsServiceInstance = Container.get(rgsService);
    const userServiceInstance = Container.get(userService);

    let playerInfo = await rgsServiceInstance.validateToken({
      token: data.token,
      gameCode: GameCode.CRASH,
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
    let currGame: { gameId: string; multiplier: number } = this.cache.get(
      `${GameCode.CRASH}/activeGame`
    );
    let activeGameInfo: WSCrashGameInterface;
    let activeGame = {};
    let gameUnderMaintenance = await this.crashHashModel.exists({isUsed: false});

    if (currGame?.gameId) {
      activeGameInfo = this.cache.get(`${GameCode.CRASH}/${currGame.gameId}`);
      const playerJoined = await this.gameModel.find({gameCode: GameCode.CRASH, gameId: currGame.gameId, gameMode: playerInfo.gameMode}).select({
        gameId: 1,
        token: 1,
        userId: 1,
        betId: 1,
        payout: 1,
        payoutMultiplier: 1,
        betAmount: 1,
        currency: 1,
        gameCode: 1,
        gameMode: 1,
        state: 1,
        betStatus: 1,
        date: 1,
      }).lean()

      activeGame = {
        ...activeGameInfo,
        players: playerJoined.reduce((map, curr) => {
          let _map = [...map];
          let _temp = activeGameInfo?.players[playerInfo.gameMode]?.find((el) => el?.betId === curr?.betId);

          _map.push({
            ...curr,
            betStatus: !!_temp?.betStatus ? _temp?.betStatus : curr?.betStatus,
            payout: [MultiPlayerGameStates.ended] ? curr.payout : _temp?.payout || 0,
            payoutMultiplier: [MultiPlayerGameStates.ended] ? curr.payoutMultiplier : _temp?.payoutMultiplier || 0,
            crashState: {cashOutAt: (curr?.state as CrashPlayerStatusInterface)?.cashOutAt || 0}
          })

          return _map
        }, []),
      };
    }

    // await this.gameModel.deleteMany({gameCode: GameCode.CRASH})

    this.logger.info("===CRASH: getUserSession ended===");
    return { ...playerInfo, gameCode: GameCode.CRASH, activeGame, gameUnderMaintenance: !gameUnderMaintenance };
  }

  public async betPlace(data: CrashBetSessionInterface) {
    this.logger.info("===CRASH: betPlace started ===");
    const rgsServiceInstance = Container.get(rgsService);

    let game: WSCrashGameInterface = this.cache.get(
      `${GameCode.CRASH}/${data.gameId}`
    );

    if (!game) throw new Error(i18next.t("crash.invalidGameId"));
    if (game.status !== MultiPlayerGameStates.acceptBet)
      throw new Error(i18next.t("crash.betNotAllowed"));

    const user = await this.userModel
      .findOne({ userId: data.userId, brandId: data.brandId, platformId: data.platformId, operatorId: data.operatorId })
      .select({
        _id: 1,
        serverSeed: 1,
        clientSeed: 1,
        hashedServerSeed: 1,
        nonce: 1,
      })
      .lean();

    if (!user._id || !user?.hashedServerSeed) {
      throw new Error(i18next.t("general.invalidUserSeed"));
    }

    // const betId = game?.round?.toString() ? `${game?.round?.toString()}-${data.token}-${data.betNumber}` : uuidv4();
    const betId = uuidv4();

    const { balance } = await rgsServiceInstance.debit({
      token: data.token,
      playerId: data.userId,
      amount: data.betAmount,
      betId,
      gameCode: GameCode.CRASH,
      roundId: game?.round?.toString()
    });

    const info = {
      token: data.token,
      gameCode: GameCode.CRASH,
      gameMode: data.gameMode,
      userId: data.userId,
      currency: data.currency,
      betAmount: data.betAmount,
      clientSeed: user.clientSeed,
      serverSeed: user.serverSeed,
      hashedServerSeed: user.hashedServerSeed,
      nonce: user.nonce,
      betId,
      platformId: data.platformId,
      brandId: data.brandId,
      operatorId: data.operatorId,
      payout: 0,
      payoutMultiplier: 0,
      active: false,
      gameId: data.gameId,
      betStatus: BetStatus.debitSuccess,
      state: {
        cashOutAt: data?.cashOutAt || 0,
      },
      date: new Date(),
    };

    const betResp = {
      gameId: data.gameId,
      token: data.token,
      userId: data.userId,
      betId,
      payout: 0,
      payoutMultiplier: 0,
      balance,
      betAmount: data.betAmount,
      currency: data.currency,
      gameCode: GameCode.CRASH,
      gameMode: data.gameMode,
      crashState: {
        cashOutAt: data?.cashOutAt || 0,
      },
      date: info.date,
    };

    //Emit Soctket event for bet place as per by game Mode
    this.socket.to(`${data.brandId}/${data.gameMode}/${GameCode.CRASH}`).emit(
      `${GameCode.CRASH}/${SocketEvents.betPlaced}`,
      betResp
    );

    await this.gameModel.create(info);
    await this.userModel.updateOne(
      { _id: user._id },
      { $inc: {nonce: 1} }
    );

    this.logger.info("===CRASH: betPlace ended===");
    return betResp;
  }

  public async cashOut(data: CrashGameCashoutInterface) {
    this.logger.info("===CRASH: cashOut started for user %s===", data.userId);

    let game: WSCrashGameInterface = this.cache.get(
      `${GameCode.CRASH}/${data.gameId}`
    );
    let gameCurrStatus: { gameId: string; multiplier: number } = this.cache.get(
      `${GameCode.CRASH}/activeGame`
    );

    if (!game) throw new Error(i18next.t("crash.invalidGameId"));
    if (game.status !== MultiPlayerGameStates.running)
      throw new Error(i18next.t("crash.invalidCashout"));

    let _crashMultiplierByRTP = game.crashMultiplier[data.gameMode];
    let playerInfo = game.players[data.gameMode].find(
      (el) => el.betId === data.betId && el.brandId === data.brandId
    );

    if (
      !playerInfo?.betStatus ||
      playerInfo.betStatus !== BetStatus.debitSuccess
    )
      throw new Error(i18next.t("crash.betAlreadySettled"));
    if (gameCurrStatus.multiplier > _crashMultiplierByRTP)
      throw new Error(i18next.t("crash.gameEnded"));

    playerInfo = {
      ...playerInfo,
      payout: playerInfo.betAmount * gameCurrStatus.multiplier,
      payoutMultiplier: gameCurrStatus.multiplier,
      betStatus: BetStatus.creditSuccess,
    };

    this.cache.set(`${GameCode.CRASH}/${game.id}`, {
      ...game,
      players: {
        ...game.players,
        [data.gameMode]: game.players[data.gameMode].map((info) => {
          return info.betId === playerInfo.betId ? {...playerInfo} : {...info}
        }) 
      },
    });
    this.socket.to(`${data.brandId}/${data.gameMode}`).emit(`${SocketEvents.cashedout}`, {...playerInfo, isRoundEnd: false});

    await this.gameModel.updateOne({
      gameId: data.gameId,
      betId: data.betId,
      brandId: data.brandId,
      platformId: data.platformId,
      operatorId: data.operatorId,
      userId: data.userId,
      gameMode: data.gameMode,
      gameCode: GameCode.CRASH,
    }, {
      payout: playerInfo?.payout,
      payoutMultiplier: playerInfo?.payoutMultiplier,
      betStatus: BetStatus.creditUnderProcess,
    })

    // this.userCreditSettle(playerInfo);
    this.logger.info("===CRASH: cashOut ended ===");

    return { ok: true, gameCode: GameCode.CRASH };
  }

  public async getBetInfo(data: BetInfo) {
    this.logger.info("===getBetInfo started for player %s===", data.userId);

    const resp = await this.gameModel
      .findOne({
        // userId: data.userId,
        betId: data.betId,
        gameCode: GameCode.CRASH,
        gameMode: data.gameMode,
        brandId: data.brandId,
        operatorId: data.operatorId,
        platformId: data.platformId
      })
      .select({
        userId: 1,
        currency: 1,
        betAmount: 1,
        betId: 1,
        gameId: 1,
        payout: 1,
        payoutMultiplier: 1,
        date: 1,
        state: 1,
        clientSeed: 1,
        serverSeed: 1,
        hashedServerSeed: 1,
        nonce: 1,
        gameCode: 1,
        gameMode: 1,
      })
      .lean();

    if (!resp?._id) {
      throw new Error(i18next.t("general.invalidBetId"));
    }

    const user = await this.userModel
      .findOne({
        userId: data.userId,
        brandId: data.brandId,
        operatorId: data.operatorId,
        platformId: data.platformId,
      })
      .select({ serverSeed: 1 });

    let gameInfo = await this.crashGames.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(resp.gameId),
        },
      },
      {
        $lookup: {
          // from: "crash_games",
          from: "crash_hashcodes",
          localField: "hashId",
          foreignField: "_id",
          as: "hashInfo",
        },
      },
      {
        $unwind: {
          path: "$hashInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          // from: "crash_games",
          from: "game_seeds",
          localField: "seedId",
          foreignField: "_id",
          as: "seedInfo",
        },
      },
      {
        $unwind: {
          path: "$seedInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          crashMultiplier: 1,
          hashInfo: {
            hash: 1,
          },
          seedInfo: {
            seed: 1,
          },
        },
      },
    ]);

    let game: WSCrashGameInterface = this.cache.get(
      `${GameCode.CRASH}/${resp.gameId}`
    );

    let playerInfo = {...resp, crashState: { ...resp.state }};

    if(game && game.status !== MultiPlayerGameStates.ended) {
    //@ts-ignore
     playerInfo = game.players[resp.gameMode].find(el => el.betId === data.betId);
    }

    this.logger.info("===getBetInfo ended===");

    return {
      ...playerInfo,
      clientSeed: resp?.clientSeed,
      hashedServerSeed: resp?.hashedServerSeed,
      nonce: resp?.nonce,
      serverSeed: resp.serverSeed === user.serverSeed ? null : resp.serverSeed,
       //@ts-ignore
      seed: gameInfo[0]?.seedInfo?.seed,
       //@ts-ignore
      hash: gameInfo[0]?.hashInfo?.hash,
       //@ts-ignore
      crashAt: !game 
        ? gameInfo[0]?.crashMultiplier[data.gameMode] 
        : game?.status === MultiPlayerGameStates.ended ?  gameInfo[0]?.crashMultiplier[data.gameMode] : 0
    };
  }

  public async getCrashGameInfoById(data: PreviousCrashInfo) {
    this.logger.info("===getCrashGameInfoById started for player %s===", data.userId);
    const leaderboard = await this.gameModel
      .find({
        gameId: data.gameId,
        gameCode: GameCode.CRASH,
        gameMode: data.gameMode,
        brandId: data.brandId,
        operatorId: data.operatorId,
        platformId: data.platformId,
      })
      .select({
        userId: 1,
        currency: 1,
        betAmount: 1,
        betId: 1,
        gameId: 1,
        payout: 1,
        payoutMultiplier: 1,
        date: 1,
      })
      .lean();

      let gameInfo = await this.crashGames.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(data.gameId),
          },
        },
        {
          $lookup: {
            from: "crash_hashcodes",
            localField: "hashId",
            foreignField: "_id",
            as: "hashInfo",
          },
        },
        {
          $unwind: {
            path: "$hashInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            // from: "crash_games",
            from: "game_seeds",
            localField: "seedId",
            foreignField: "_id",
            as: "seedInfo",
          },
        },
        {
          $unwind: {
            path: "$seedInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            crashMultiplier: 1,
            round: 1,
            createdAt: 1,
            hashInfo: {
              hash: 1,
            },
            seedInfo: {
              seed: 1,
            },
          },
        },
      ]);

    this.logger.info("===getCrashGameInfoById started for player %s===", data.userId);

    return {
      leaderboard,
      round: gameInfo[0]?.round,
      date: gameInfo[0]?.createdAt,
      seed: gameInfo[0]?.seedInfo?.seed,
       //@ts-ignore
      hash: gameInfo[0]?.hashInfo?.hash,
       //@ts-ignore
      crashAt: gameInfo[0]?.crashMultiplier[data.gameMode],
      gameCode: data.gameCode
    };
  }
}
