import { Server } from "socket.io";
import moment from "moment";
import NodeCache from "node-cache";
import Container from "typedi";
import mongoose from "mongoose";
import i18next, { use } from "i18next";
import CommonService from "./common";
import { v4 as uuidv4 } from "uuid";
import { Inject, Service } from "typedi";
import multiplayerOutcome from "./provablyFair/multiplayerOutcomes";
import aviatorXProvablyService from "./provablyFair/aviatorXService"
import {
  AviatorXBetSessionInterface,
  AviatorXGameCancelInterface,
  AviatorXPlayerStatusInterface,
  InitSchemaInterface,
  WSAviatorXGameInterface,
  WSAviatorXPlayersInterface,
  AviatorXGameCashoutInterface,
  BetInfo,
  PreviousAviatorXInfo,
  AviatorXWinReport,
  AviatorXLastGameRecord
} from "../interfaces/aviatorx";
import {
  GameCode,
  GameMode,
  SocketEvents,
  MultiPlayerGameStates,
  BetStatus,
  ReportType,
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
    @Inject("aviatorXServerModel")
    private aviatorXServerModel: Models.AviatorXServerModel,
    @Inject("aviatorXGameModel")
    private aviatorXGameModel: Models.AviatorXGameModel,
    @Inject("userModel") private userModel: Models.UserModel
  ) {
    super();
  }

  public async _checkAndSettleAutoCashout(
    gameId: string,
    currMultiplier: number
  ) {
    // this.logger.info(
    //   "===AVIATORX: _checkAndSettleAutoCashout started for game %s===",
    //   gameId
    // );
    let game: WSAviatorXGameInterface = this.cache.get(
      `${GameCode.AVIATORX}/${gameId}`
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
      let _players: WSAviatorXPlayersInterface[] = game.players[_gameMode];
      let _crashMultiplierByRTP = game.crashMultiplier[_gameMode];

      for (const info of _players) {
        let playerInfo;
        //for gameModes which will crash earlier
        if (
          info.betStatus === BetStatus.debitSuccess &&
          currMultiplier > _crashMultiplierByRTP
        ) {
          playerInfo = {
            ...info,
            payout:
              info.crashState.cashOutAt > 0 &&
              info.crashState.cashOutAt <= _crashMultiplierByRTP
                ? info.betAmount * info.crashState.cashOutAt
                : 0,
            payoutMultiplier:
              info.crashState.cashOutAt > 0 &&
              info.crashState.cashOutAt <= _crashMultiplierByRTP
                ? info.crashState.cashOutAt
                : 0,
            betStatus:
              info.crashState.cashOutAt > 0 &&
              info.crashState.cashOutAt <= _crashMultiplierByRTP
                ? BetStatus.creditSuccess
                : BetStatus.debitSuccess,
          };

          info.crashState.cashOutAt <= _crashMultiplierByRTP &&
            info.crashState.cashOutAt > 0 &&
            this.socket.to(`${info.brandId}/${info.gameMode}`).emit(`${SocketEvents.cashedout}`, {
              ...playerInfo,
              isRoundEnd: false,
            });
        } else if (
          info.betStatus === BetStatus.debitSuccess &&
          info.crashState.cashOutAt > 0 &&
          currMultiplier > info.crashState.cashOutAt &&
          currMultiplier < _crashMultiplierByRTP
        ) {
          playerInfo = {
            ...info,
            payout: info.betAmount * info.crashState.cashOutAt,
            payoutMultiplier: info.crashState.cashOutAt,
            betStatus: BetStatus.creditSuccess,
          };

          this.socket.to(`${info.brandId}/${info.gameMode}`).emit(`${SocketEvents.cashedout}`, {
            ...playerInfo,
            isRoundEnd: false,
          });
        } else {
          playerInfo = { ...info };
        }

        _updatedPlayerInfo = {
          ..._updatedPlayerInfo,
          [_gameMode]: [..._updatedPlayerInfo[_gameMode], { ...playerInfo }],
        };
      }
    }

    this.cache.set(`${GameCode.AVIATORX}/${gameId}`, {
      ...game,
      players: { ..._updatedPlayerInfo },
    });

    // this.logger.info("===AVIATORX: _checkAndSettleAutoCashout ended %s===");
  }

  public async _runGame(gameId: string) {
    let game: WSAviatorXGameInterface = this.cache.get(
      `${GameCode.AVIATORX}/${gameId}`
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

    this.logger.info(
      "===AVIATORX: _checkAndSettleAutoCashout will be exceted till game %s crash at %s===",
      game.id,
      finalCrashMultiplier
    );

    for (let i = 1, j = 1; i <= finalCrashMultiplier; j++) {
      await this.timer(100);

      for (let temp = 0; temp < _gameModes.length; temp++) {
        let _gameMode = _gameModes[temp];

        //trigger globally to all user across platform but rtp wise
        game.crashMultiplier[_gameMode] < i
          ? this.socket
              .to(`${_gameMode}/${GameCode.AVIATORX}`)
              .emit(
                `${GameCode.AVIATORX}/${MultiPlayerGameStates.halt}`,
                {
                  gameId: game.id,
                  status: MultiPlayerGameStates.halt,
                  multiplier: game.crashMultiplier[_gameMode],
                  isCrashed: true,
                  delay: null,
                }
              )
          : this.socket
              .to(`${_gameMode}/${GameCode.AVIATORX}`)
              .emit(
                `${GameCode.AVIATORX}/${MultiPlayerGameStates.running}`,
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
        let currGame: { gameId: string; multiplier: number, nextGameHashedSeed: string } = this.cache.get(
          `${GameCode.AVIATORX}/activeGame`
        );

        this.cache.set(`${GameCode.AVIATORX}/activeGame`, {
          gameId: game.id,
          multiplier: i,
          nextGameHashedSeed: currGame?.nextGameHashedSeed
        });
        this._checkAndSettleAutoCashout(game.id, i);
      }

      let next = Math.pow(1.01, j);
      i = next;

      if (i > finalCrashMultiplier) {
        i = finalCrashMultiplier;
        this.logger.info(
          "===AVIATORX: game %s has been crashed at %s===",
          game.id,
          finalCrashMultiplier
        );

        //fetch current player info before updating the game status
        game = this.cache.get(`${GameCode.AVIATORX}/${gameId}`);

        this.cache.set(`${GameCode.AVIATORX}/${game.id}`, {
          ...game,
          status: MultiPlayerGameStates.ended,
        });

        //trigger globally to all user across platform
        this.socket
          .to(GameCode.AVIATORX)
          .emit(`${GameCode.AVIATORX}/${MultiPlayerGameStates.ended}`, {
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
      "===AVIATORX: _handleGameCrash started for game %s===",
      gameId
    );
    const rgsServiceInstance = Container.get(rgsService);
    this.initiatePerformanceLogger();
    this.startPerformanceLogging();

    let game: WSAviatorXGameInterface = this.cache.get(
      `${GameCode.AVIATORX}/${gameId}`
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
          gameCode: GameCode.AVIATORX,
          clientSeed: _user?.clientSeed || "",
          serverSeed: _user?.serverSeed || "",
          hashedServerSeed: _user?.hashedServerSeed || "",
          nonce: _user?.nonce,
          roundId: game?.round?.toString(),
        };
      })
    );

    // let history = [];

    for (let i = 0; i < players.length; i++) {
      let _player: WSAviatorXPlayersInterface = players[i];
      let _user = users.find((el) => el.userId === _player.userId);
      let _resp = creditResp.find(
        (info) => info?.transaction_id === _player.betId
      );

      this.logger.info(
        "===AVIATORX: _handleGameCrash -> settling rgs credit for user %s and betId %s===",
        _player.userId,
        _player.betId
      );

      try {
        if (!_user || !_user?._id || !_user?.hashedServerSeed) {
          throw new Error(i18next.t("general.invalidUserSeed"));
        }

        if (_resp?.error)
          throw new Error(_resp?.description || "credit internal error");

        //NOTE: Balance update handled by rgs
        this.socket
          .to(_player.userId)
          .emit(
            `${SocketEvents.balance}`,
            { balance: _resp?.balance, userId: _player.userId }
          );

        if (_player.betStatus === BetStatus.debitSuccess) {
          //Need to trigger cashout for players who lost
          this.socket.to(`${_player.brandId}/${_player.gameMode}`).emit(`${SocketEvents.cashedout}`, {
            gameCode: GameCode.AVIATORX,
            gameMode: _player.gameMode,
            date: _player.date,
            currency: _player.currency,
            betAmount: _player.betAmount || 0,
            payoutMultiplier: _player?.payoutMultiplier || 0,
            payout: _player?.payout || 0,
            betId: _player?.betId,
            userId: _player?.userId,
            isRoundEnd: true,
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
                gameCode: GameCode.AVIATORX,
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
    await this.aviatorXGameModel.findOneAndUpdate(
      {
        _id: game.id,
      },
      { status: MultiPlayerGameStates.ended }
    );

    this.endPerformanceLogging("AVIATORX: _handleGameCrash");
    this.logger.info("===AVIATORX: _handleGameCrash ended %s===");
  }

  public async createGame() {
    this.logger.info("===AVIATORX: createGame started ===");

    const gameSeedInfo = await this.aviatorXServerModel
      .find({ isUsed: false })
      .sort({ order: 1 })
      .limit(2)
      .lean();

    if (gameSeedInfo?.length < 2) {
      this.socket
      .to(GameCode.AVIATORX)
      .emit(`${GameCode.AVIATORX}/${MultiPlayerGameStates.underMaintenance}`, {
        message: "Game under maintainence"
      });

      throw new Error(i18next.t("crash.seedExhausted"));
    }
      

    const aviatorXProvablyInstance = Container.get(aviatorXProvablyService);

    //Expire the respective hashcode being used and create a game in DB
    this.logger.info("===AVIATORX: adding new game===");
    await this.aviatorXServerModel.updateOne({_id: gameSeedInfo[0]._id}, {isUsed: true});
    const gameResp = await this.aviatorXGameModel.create({
      seedId: gameSeedInfo[0]._id,
      status: MultiPlayerGameStates.scheduled,
      round: gameSeedInfo[0].order,
    });
    this.cache.set(`${GameCode.AVIATORX}/activeGame`, {
      gameId: gameResp._id,
      multiplier: 1,
      nextGameHashedSeed: gameSeedInfo[1]?.hashedServerSeed || ""
    });

    let wsGameResp = {
      id: gameResp._id,
      crashMultiplier: {},
      status: MultiPlayerGameStates.scheduled,
      round: gameSeedInfo[0].order,
      players: {
        [GameMode.ONE]: [],
        [GameMode.TWO]: [],
        [GameMode.THREE]: [],
        [GameMode.FIVE]: [],
        [GameMode.SEVEN]: [],
      },
    };

    //Triggering socket event for new game
    this.socket
      .to(GameCode.AVIATORX)
      .emit(`${GameCode.AVIATORX}/${MultiPlayerGameStates.scheduled}`, {
        gameId: wsGameResp.id,
        status: wsGameResp.status,
        nextGameHashedSeed: gameSeedInfo[1]?.hashedServerSeed || ""
      });

    //Triggering socket event for accepting bet and update DB async
    this.cache.set(`${GameCode.AVIATORX}/${wsGameResp.id}`, {
      ...wsGameResp,
      status: MultiPlayerGameStates.acceptBet,
    });
    this.socket
      .to(GameCode.AVIATORX)
      .emit(`${GameCode.AVIATORX}/${MultiPlayerGameStates.acceptBet}`, {
        gameId: wsGameResp.id,
        status: MultiPlayerGameStates.acceptBet,
        delay: 5000,
      });
    await this.aviatorXGameModel.updateOne(
      { _id: wsGameResp.id },
      { status: MultiPlayerGameStates.acceptBet }
    );


    this.logger.info(
      "===AVIATORX: game %s updated to bet accepting state ===",
      gameResp._id
    );
    await this.timer(5000);

    //emit socket event for game starting and move game DB to runing state
    this.cache.set(`${GameCode.AVIATORX}/${wsGameResp.id}`, {
      ...wsGameResp,
      status: MultiPlayerGameStates.starting,
    });
    this.socket
      .to(GameCode.AVIATORX)
      .emit(`${GameCode.AVIATORX}/${MultiPlayerGameStates.starting}`, {
        gameId: wsGameResp.id,
        status: MultiPlayerGameStates.starting,
        delay: 2000,
      });

    await this.timer(2000);

    
    //update cache with players joined the games
    const playerJoined = await this.gameModel
      .find({
        gameCode: GameCode.AVIATORX,
        gameId: wsGameResp.id,
        betStatus: BetStatus.debitSuccess,
      })
      .select({
        gameId: 1,
        token: 1,
        clientSeed: 1,
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
        avtar: 1,
        createdAt: 1,
        platformId: 1,
        operatorId: 1,
        brandId: 1
      })
      .sort({createdAt: 1})
      .lean();

    let firstThreeBettersCleintSeed = []
    let _players = [];

    for (const info of playerJoined) {
      if(_players.length<3 && !_players.find(el => el?.userId === info.userId)) {
        firstThreeBettersCleintSeed.push(info?.clientSeed || "");
        _players.push({
          userId: info.userId,
          betId: info.betId,
          userName: "",
          avtar: info?.avtar || "",
          clientSeed: info.clientSeed
        })
      }
      
      wsGameResp.players[info.gameMode] = [
        ...wsGameResp.players[info.gameMode],
        {
          ...info,
          crashState: {
            cashOutAt:
              (info?.state as AviatorXPlayerStatusInterface)?.cashOutAt || 0,
          },
        },
      ];
    }

    let {outcomes, hash} = await aviatorXProvablyInstance.generateGameOutcomes(
      gameSeedInfo[0]?.serverSeed,
      firstThreeBettersCleintSeed.join("")
    );

    await this.aviatorXGameModel.findOneAndUpdate(
      { _id: wsGameResp.id },
      { status: MultiPlayerGameStates.running, crashMultiplier: outcomes, hash: hash, players: _players }
    );

    wsGameResp = {
      ...wsGameResp,
      crashMultiplier: outcomes,
      status: MultiPlayerGameStates.running,
    };

    this.cache.set(`${GameCode.AVIATORX}/${wsGameResp.id}`, wsGameResp);

    //Update Game to running state in cache
    this.logger.info(
      "===AVIATORX: game %s updated to running state ===",
      gameResp._id
    );

    await this._runGame(wsGameResp.id);
    await this._handleGameCrash(wsGameResp.id);

    await this.timer(2000);

    //Clear cache for game completed
    this.cache.del([
      `${GameCode.AVIATORX}/${wsGameResp.id}`,
      `${GameCode.AVIATORX}/activeGame`,
    ]);
    this.logger.info("===AVIATORX: createGame ended ===");

    return {
      proceedNext: true,
      message: "",
    };
  }

  public async getUserSession(data: InitSchemaInterface) {
    this.logger.info("===AVIATORX: getUserSession started ===");
    const rgsServiceInstance = Container.get(rgsService);
    const userServiceInstance = Container.get(userService);

    let playerInfo = await rgsServiceInstance.validateToken({
      token: data.token,
      gameCode: GameCode.AVIATORX,
    });

    let clientSeed: string;

    const isExistingUser = await this.userModel
      .findOne({
        userId: playerInfo.playerId,
        platformId: playerInfo?.platformId,
        operatorId: playerInfo?.operatorId,
        brandId: playerInfo?.brandId,
      })
      .select({ avtar: 1, clientSeed: 1 })
      .lean();

    if (!isExistingUser?._id) {
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

      clientSeed = playerInfo.playerId.slice(0, 10);
    } else clientSeed = isExistingUser.clientSeed
    let currGame: { gameId: string; multiplier: number, nextGameHashedSeed: string } = this.cache.get(
      `${GameCode.AVIATORX}/activeGame`
    );
    let activeGameInfo: WSAviatorXGameInterface;
    let activeGame = {};
    let gameUnderMaintenance = await this.aviatorXServerModel.exists({isUsed: false});

    if (currGame?.gameId) {
      activeGameInfo = this.cache.get(
        `${GameCode.AVIATORX}/${currGame.gameId}`
      );
      const playerJoined = await this.gameModel
        .find({
          gameCode: GameCode.AVIATORX,
          gameId: currGame.gameId,
          gameMode: playerInfo.gameMode,
        })
        .select({
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
        })
        .lean();

      activeGame = {
        ...activeGameInfo,
        players: playerJoined.reduce((map, curr) => {
          let _map = [...map];
          let _temp = activeGameInfo?.players[playerInfo.gameMode]?.find(
            (el) => el?.betId === curr?.betId
          );

          _map.push({
            ...curr,
            betStatus: !!_temp?.betStatus ? _temp?.betStatus : curr?.betStatus,
            payout: [MultiPlayerGameStates.ended]
              ? curr.payout
              : _temp?.payout || 0,
            payoutMultiplier: [MultiPlayerGameStates.ended]
              ? curr.payoutMultiplier
              : _temp?.payoutMultiplier || 0,
            crashState: {
              cashOutAt:
                (curr?.state as AviatorXPlayerStatusInterface)?.cashOutAt || 0,
            },
          });

          return _map;
        }, []),
      };
    }
    // `crashMultiplier.${playerInfo.gameMode}`
    let prevRounds = await this.aviatorXGameModel
      .find({
        status: MultiPlayerGameStates.ended,
      })
      .select({ crashMultiplier: 1 })
      .limit(30) //@ts-ignore
      .sort({ round: "desc" })
      .lean();

    // await this.gameModel.deleteMany({gameCode: GameCode.AVIATORX})

    this.logger.info("===AVIATORX: getUserSession ended===");
    return {
      ...playerInfo,
      gameCode: GameCode.AVIATORX,
      activeGame,
      avtar: isExistingUser?.avtar || "av1",
      nextGameHashedSeed: currGame?.nextGameHashedSeed || "",
      clientSeed,
      gameUnderMaintenance: !gameUnderMaintenance,
      prevRounds: prevRounds.map((el) => {
        return {
          id: el._id,
          multiplier: el.crashMultiplier[playerInfo.gameMode],
        };
      }),
    };
  }

  public async betPlace(data: AviatorXBetSessionInterface) {
    this.logger.info("===AVIATORX: betPlace started ===");
    const rgsServiceInstance = Container.get(rgsService);

    let game: WSAviatorXGameInterface = this.cache.get(
      `${GameCode.AVIATORX}/${data.gameId}`
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
        avtar: 1,
        nonce: 1,
      })
      .lean();

    if (!user?._id || !user?.hashedServerSeed) {
      throw new Error(i18next.t("general.invalidUserSeed"));
    }

    const betCount = await this.gameModel.count({
      userId: user._id,
      gameId: new mongoose.Types.ObjectId(data.gameId),
      gameCode: GameCode.AVIATORX
    });

    if(betCount > 2) throw new Error(i18next.t("crash.maxBetExceed"));

    // const betId = game?.round?.toString() ? `${game?.round?.toString()}-${data.token}-${data.betNumber}` : uuidv4();
    const betId = uuidv4();

    const { balance } = await rgsServiceInstance.debit({
      token: data.token,
      playerId: data.userId,
      amount: data.betAmount,
      betId,
      gameCode: GameCode.AVIATORX,
      roundId: game?.round?.toString(),
    });

    const info = {
      token: data.token,
      gameCode: GameCode.AVIATORX,
      gameMode: data.gameMode,
      userId: data.userId,
      currency: data.currency,
      betAmount: data.betAmount,
      clientSeed: user.clientSeed,
      serverSeed: user.serverSeed,
      hashedServerSeed: user.hashedServerSeed,
      nonce: user.nonce,
      avtar: user?.avtar || "",
      platformId: data.platformId,
      brandId: data.brandId,
      operatorId: data.operatorId,
      betId,
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
      gameCode: GameCode.AVIATORX,
      gameMode: data.gameMode,
      avtar: user.avtar,
      crashState: {
        cashOutAt: data?.cashOutAt || 0,
      },
      date: info.date,
    };

    //Emit Soctket event for bet place as per by game Mode
    this.socket
      .to(`${data.brandId}/${data.gameMode}/${GameCode.AVIATORX}`)
      .emit(
        `${GameCode.AVIATORX}/${SocketEvents.betPlaced}`,
        betResp
      );

    await this.gameModel.create(info);
    await this.userModel.updateOne({ _id: user?._id }, { $inc: { nonce: 1 } });

    this.logger.info("===AVIATORX: betPlace ended===");
    return betResp;
  }

  public async cancelBet(data: AviatorXGameCancelInterface) {
    this.logger.info("===AVIATORX: cancelBet started ===");
    const rgsServiceInstance = Container.get(rgsService);

    let game: WSAviatorXGameInterface = this.cache.get(
      `${GameCode.AVIATORX}/${data.gameId}`
    );

    if (!game) throw new Error(i18next.t("crash.invalidGameId"));
    if (game.status !== MultiPlayerGameStates.acceptBet)
      throw new Error(i18next.t("crash.cancelNotAllowed"));

    let _targetPlayer = await this.gameModel
      .findOne({
        gameId: data.gameId,
        betId: data.betId,
        userId: data.userId,
        gameMode: data.gameMode,
        platformId: data.platformId,
        operatorId: data.operatorId,
        brandId: data.brandId,
        gameCode: GameCode.AVIATORX,
      })
      .select({ betId: 1, betAmount: 1 })
      .lean();

    //@ts-ignore
    if (!_targetPlayer?.betId) throw new Error(i18next.t("crash.invalidBetId"));

    await this.gameModel.updateOne(
      {
        gameId: data.gameId,
        betId: data.betId,
        userId: data.userId,
        gameMode: data.gameMode,
        gameCode: GameCode.AVIATORX,
        platformId: data.platformId,
        operatorId: data.operatorId,
        brandId: data.brandId,
      },
      {
        payout: 0,
        payoutMultiplier: 0,
        betStatus: BetStatus.refund,
      }
    );

    //call rgs refund
    await rgsServiceInstance.refund({
      token: data.token,
      playerId: data.userId,
      betId: data.betId,
      gameCode: GameCode.AVIATORX,
      //@ts-ignore
      amount: _targetPlayer.betAmount,
    });

    //Emit Soctket event for bet place as per by game Mode
    this.socket
      .to(`${data.brandId}/${data.gameMode}/${GameCode.AVIATORX}`)
      .emit(
        `${GameCode.AVIATORX}/${SocketEvents.betCancelled}`,
        { ...data }
      );

    this.logger.info("===AVIATORX: betPlace ended===");
    return { ok: true, gameCode: GameCode.AVIATORX };
  }

  public async cashOut(data: AviatorXGameCashoutInterface) {
    this.logger.info(
      "===AVIATORX: cashOut started for user %s===",
      data.userId
    );

    let game: WSAviatorXGameInterface = this.cache.get(
      `${GameCode.AVIATORX}/${data.gameId}`
    );
    let gameCurrStatus: { gameId: string; multiplier: number } = this.cache.get(
      `${GameCode.AVIATORX}/activeGame`
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

    this.cache.set(`${GameCode.AVIATORX}/${game.id}`, {
      ...game,
      players: {
        ...game.players,
        [data.gameMode]: game.players[data.gameMode].map((info) => {
          return info.betId === playerInfo.betId
            ? { ...playerInfo }
            : { ...info };
        }),
      },
    });
    this.socket.to(`${data.brandId}/${data.gameMode}`).emit(`${SocketEvents.cashedout}`, {
      ...playerInfo,
      isRoundEnd: false,
    });

    await this.gameModel.updateOne(
      {
        gameId: data.gameId,
        betId: data.betId,
        brandId: data.brandId,
        platformId: data.platformId,
        operatorId: data.operatorId,
        userId: data.userId,
        gameMode: data.gameMode,
        gameCode: GameCode.AVIATORX,
      },
      {
        payout: playerInfo?.payout,
        payoutMultiplier: playerInfo?.payoutMultiplier,
        betStatus: BetStatus.creditUnderProcess,
      }
    );

    // this.userCreditSettle(playerInfo);
    this.logger.info("===AVIATORX: cashOut ended ===");

    return { ok: true, gameCode: GameCode.AVIATORX };
  }

  public async updateUserAvtar(data: { avtar: String; userId: String }) {
    this.logger.info(
      "===updateUserAvtar started for player %s===",
      data.userId
    );
    let resp = await this.userModel.updateOne(
      { userId: data.userId },
      { avtar: data.avtar }
    );

    this.logger.info("===updateUserAvtar ended for player %s===", data.userId);

    return { ok: true, gameCode: GameCode.AVIATORX };
  }

  public async getWinReport(data: AviatorXWinReport) {
    this.logger.info("===getWinReport started for player %s===", data.userId);
    const pageOptions = {
      page: data?.page || 0,
      limit: data?.limit || 10,
      orderBy: data?.orderBy ? (data?.orderBy === "desc" ? -1 : 1) : -1,
    };
    let start = moment().startOf(data.duration);
    let end = moment().endOf(data.duration);

    let filters = {
      createdAt: {
        //@ts-ignore
        $gte: new Date(start),
        //@ts-ignore
        $lte: new Date(end),
      },
      gameMode: data.gameMode,
      gameCode: GameCode.AVIATORX,
      betStatus: { $in: [BetStatus.creditSuccess] },
      platformId: data.platformId,
      operatorId: data.operatorId,
      brandId: data.brandId
    };
    let resp;

    if (
      [ReportType.BIGGEST_WIN, ReportType.HUGE_WIN].includes(data.reportType)
    ) {
      let sortCondition = ReportType.HUGE_WIN
        ? { payoutMultiplier: pageOptions.orderBy }
        : { payout: pageOptions.orderBy };
     
      resp = await this.gameModel
        .aggregate([
          {
            $match: { ...filters },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "userId",
              as: "userInfo",
            },
          },
          {
            $unwind: {
              path: "$userInfo",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              // from: "crash_games",
              from: "aviatorx_games",
              localField: "gameId",
              foreignField: "_id",
              as: "gameInfo",
            },
          },
          {
            $unwind: {
              path: "$gameInfo",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              userId: 1,
              gameCode: 1,
              betAmount: 1,
              currency: 1,
              betId: 1,
              payout: 1,
              payoutMultiplier: 1,
              createdAt: 1,
              gameId: 1,
              userAvatar: "$userInfo.avtar",
              crashMultiplier: `$gameInfo.crashMultiplier.${data.gameMode}`,
              round: `$gameInfo.round`,
            },
          },
          {
            //@ts-ignore
            $sort: sortCondition,
          },
          {
            $limit: 10
          }
          
        ]) 
    } else {
      resp = await this.aviatorXGameModel
        .find({ status: MultiPlayerGameStates.ended, createdAt: filters.createdAt })
        .select({ round: 1, status: 1, crashMultiplier: `$crashMultiplier.${data.gameMode}`, createdAt: 1, gameId: "$_id" }).limit(50).lean();

        resp.sort((a, b) => (a?.crashMultiplier > b?.crashMultiplier ? -1 : 1))
    }
    
    this.logger.info("===getWinReport started for player %s===", data.userId);
    return { gameCode: GameCode.AVIATORX, data: resp || [] };
  }

  public async getLastGameRecord(data: AviatorXLastGameRecord) {
    this.logger.info("===getLastGameRecord started for player %s===", data.userId);
    let lastGame = await this.aviatorXGameModel.findOne({
      status: MultiPlayerGameStates.ended,
    }).select({
      crashMultiplier: `$crashMultiplier.${data.gameMode}`,
      createdAt: 1,
      gameId: "$_id",
      round: 1
    }).sort({round: -1}).lean();

    let list = await this.gameModel.find({
      gameId: lastGame._id,
      platformId: data.platformId,
      operatorId: data.operatorId,
      brandId: data.brandId,
      betStatus: BetStatus.creditSuccess
    }).select({
      gameId: 1,
      userId: 1,
      betId: 1,
      payout: 1,
      payoutMultiplier: 1,
      betAmount: 1,
      gameCode: 1,
      avtar: 1
    })

    this.logger.info("===getLastGameRecord ended for player %s===", data.userId);

    return {gameCode: GameCode.AVIATORX, data: list || [], gameInfo: {...lastGame}}
  }

  public async getBetInfo(data: BetInfo) {
    this.logger.info("===getBetInfo started for player %s===", data.userId);

  }

  public async getCrashGameInfoById(data: PreviousAviatorXInfo) {
    this.logger.info(
      "===getCrashGameInfoById started for player %s===",
      data.userId
    );
    let resp = await this.aviatorXGameModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(data.gameId),
          status: MultiPlayerGameStates.ended
        },
      },
      {
        $lookup: {
          from: "aviatorx_servercodes",
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
          hash: 1,
          players: 1,
          status: 1,
          round: 1,
          createdAt: 1,
          crashMultiplier: `$crashMultiplier.${data.gameMode}`,
          seed: `$seedInfo.serverSeed`,
          hashSeed: `$seedInfo.hashedServerSeed`
        },
      },
    ])

    return {
      gameCode: GameCode.AVIATORX,
      data: resp[0]
        ? {
            ...resp[0],
            hex: resp[0]?.hash?.slice(0, 13),
            decimal: parseInt(resp[0]?.hash?.slice(0, 13), 16),
          }
        : {},
    };
  }
}
