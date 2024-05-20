import { Server } from "socket.io";
import NodeCache from "node-cache";
import Container from "typedi";
import mongoose from "mongoose";
import i18next from "i18next";
import CommonService from "./common";
import { v4 as uuidv4 } from "uuid";
import { Inject, Service } from "typedi";
import multiplayerOutcome from "./provablyFair/multiplayerOutcomes";
import {
  SlideBetSessionInterface,
  InitSchemaInterface,
  WSSlideGameInterface,
  WSSlidePlayersInterface,
  SlideGameCashoutInterface,
  SlidePlayerStatusInterface,
  BetInfo,
  PreviousSlideInfo
} from "./../interfaces/slide";
import { GameSeedsInterface } from "../interfaces/common";
import {
  GameCode,
  GameMode,
  SocketEvents,
  MultiPlayerGameStates,
  BetStatus,
} from "../config/constant";
import dummy from "../config/math/slide";
import userService from "./userService";
import rgsService from "./rgsService";

@Service()
export default class SlideService extends CommonService {
  constructor(
    @Inject("logger") private logger,
    @Inject("io") private socket: Server,
    @Inject("cache") private cache: NodeCache,
    @Inject("gameSeeds") private gameSeeds: Models.GameSeedsModel,
    @Inject("gameModel") private gameModel: Models.GameModel,
    @Inject("slideHashModel") private slideHashModel: Models.SlideHashModel,
    @Inject("slideGames") private slideGames: Models.SlideGameModel,
    @Inject("userModel") private userModel: Models.UserModel
  ) {
    super();
  }

  public async _handlePlayerBets(gameId: string) {
    this.logger.info(
      "===SLIDE: _handlePlayerBets started for game %s===",
      gameId
    );
    const rgsServiceInstance = Container.get(rgsService);
    this.initiatePerformanceLogger();
    this.startPerformanceLogging();

    let game: WSSlideGameInterface = this.cache.get(
      `${GameCode.SLIDE}/${gameId}`
    );
    let players = [],
      updatedPlayerInfo = [];

    for (const _gameMode of Object.keys(game.players)) {
      players = [...players, ...game.players[_gameMode]];
    }

    let users = await this.userModel
      .find({ userId: { $in: [...new Set(players.map((el) => el.userId))] } })
      .select({
        _id: 1,
        serverSeed: 1,
        clientSeed: 1,
        hashedServerSeed: 1,
        platformId: 1,
        operatorId: 1,
        brandId: 1,
        nonce: 1,
        userId: 1,
      });

    let ldb = {
      [GameMode.ONE]: [],
      [GameMode.TWO]: [],
      [GameMode.THREE]: [],
      [GameMode.FIVE]: [],
      [GameMode.SEVEN]: [],
    }
      
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
          gameCode: GameCode.SLIDE,
          clientSeed: _user?.clientSeed || "",
          serverSeed: _user?.serverSeed || "",
          hashedServerSeed: _user?.hashedServerSeed || "",
          nonce: _user?.nonce - 1,
        };
      })
    );

    for (let i = 0; i < players.length; i++) {
      let _player: WSSlidePlayersInterface = players[i];
      let _user = users.find((el) => el.userId === _player.userId);
      let _resp = creditResp.find(
        (info) => info?.transaction_id === _player.betId
      );

      this.logger.info(
        "===SLIDE: _handlePlayerBets -> settling rgs credit for user %s and betId %s===",
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
          { balance: _resp?.balance, userId: _player.userId, betId: _player.betId }
        );

        ldb[_player?.gameMode].push({
          gameId: _player.gameId,
          userId: _player.userId,
          betId: _player.betId,
          payout: _player.payout,
          payoutMultiplier: _player.payoutMultiplier,
          betAmount: _player.betAmount,
          currency: _player.currency,
          gameCode: _player.gameCode,
          gameMode: _player.gameMode,
          slideState: _player.slideState,
          date: _player.date,
          platformId: _player.platformId,
          operatorId: _player.operatorId,
          brandId: _player.brandId
        });

        updatedPlayerInfo.push({
          ..._player,
          betStatus: BetStatus.creditSuccess,
        });

        this.socket.to(`${_player.brandId}/${_player.gameMode}`).emit(`${SocketEvents.cashedout}`, {
          userId: _player.userId,
          betId: _player.betId,
          payout: _player.payout,
          payoutMultiplier: _player.payoutMultiplier,
          betAmount: _player.betAmount,
          currency: _player.currency,
          gameCode: GameCode.SLIDE,
          date: _player.date,
        });
      } catch (e) {
        updatedPlayerInfo.push({
          ..._player,
          betStatus: BetStatus.creditFailed,
          err: e?.message || "",
        });
      }
    }

    //Emit player bet status brand and rtp wise
    for(let k=0; k<Object.keys(ldb).length; k++) {
      let _gameMode = Object.keys(ldb)[k];
      let _players = ldb[_gameMode];

      let _grpByBrand = _players.reduce((map, curr) => {
        if(map[curr?.brandId]) map[curr?.brandId] = [...map[curr?.brandId], {...curr}]
        else map[curr?.brandId] = [{...curr}]

        return map
      }, {})

      for(let l=0;l<Object.keys(_grpByBrand).length; l++){
        let _brand = Object.keys(_grpByBrand)[l];

        this.socket.to(`${_brand}/${_gameMode}/${GameCode.SLIDE}`).emit(
          `${GameCode.SLIDE}/${SocketEvents.playersBetStatus}`,
          _grpByBrand[_brand]
        );
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
                gameCode: GameCode.SLIDE,
                platformId: curr.platformId,
                operatorId: curr.operatorId,
                brandId: curr.brandId
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
    await this.slideGames.findOneAndUpdate(
      {
        _id: game.id,
      },
      { status: MultiPlayerGameStates.ended }
    );

    this.endPerformanceLogging("SLIDE: _handlePlayerBets");
    this.logger.info("===SLIDE: _handlePlayerBets ended %s===");
  }

  public async createGame() {
    this.logger.info("===SLIDE: createGame started ===");

    const hashInfo = await this.slideHashModel
      .find({ isUsed: false })
      .sort({ order: -1 })
      .limit(1)
      .lean();

    let seedInfo: GameSeedsInterface;

    if (this.cache.has(`${GameCode.SLIDE}/seeds`))
      seedInfo = this.cache.get(`${GameCode.SLIDE}/seeds`);
    else {
      this.logger.info("===SLIDE: fetching seed ===");
      seedInfo = await this.gameSeeds
        .findOne({ game_code: GameCode.SLIDE })
        .select({ seed: 1 })
        .lean();

      this.cache.set(`${GameCode.SLIDE}/seeds`, seedInfo);
    }

    if (!hashInfo[0] && !hashInfo[0]?.hash){ 
      this.socket
      .to(GameCode.SLIDE)
      .emit(`${GameCode.SLIDE}/${MultiPlayerGameStates.underMaintenance}`, {
        message: "Game under maintainence"
      });

      throw new Error(i18next.t("crash.hashExhausted"));
    }

    const gameOutcomesInstance = Container.get(multiplayerOutcome);
    const result = await gameOutcomesInstance.generateGameOutcomes(
      hashInfo[0].hash,
      seedInfo.seed,
      GameCode.SLIDE
    );

    const numbers = await gameOutcomesInstance.slideDummyOutcomes(90);

    //Expire the respective hashcode being used and create a game in DB
    this.logger.info("===SLIDE: adding new game===");
    await this.slideHashModel.updateOne({_id: hashInfo[0]._id}, {isUsed: true});
    const gameResp = await this.slideGames.create({
      hashId: hashInfo[0]._id,
      seedId: seedInfo?._id,
      multiplier: { ...result },
      numbers,
      status: MultiPlayerGameStates.scheduled,
      round: hashInfo[0].order,
    });

    let wsGameResp = {
      id: gameResp._id,
      multiplier: { ...result },
      numbers,
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

    this.cache.set(`${GameCode.SLIDE}/activeGame`, {
      gameId: gameResp._id,
      gameEndIn: 18000
    });
    

    this.cache.set(`${GameCode.SLIDE}/${wsGameResp.id}`, {
      ...wsGameResp,
    });

    //Triggering socket event for new game
    this.logger.info(
      "===SLIDE: game %s scheduled ===",
      wsGameResp.id
    );
    this.socket.to(GameCode.SLIDE).emit(`${GameCode.SLIDE}/${MultiPlayerGameStates.scheduled}`, {
      gameId: wsGameResp.id,
      numbers: wsGameResp.numbers,
      status: wsGameResp.status,
    });

    //Triggering socket event for accepting bet and update DB async
    this.cache.set(`${GameCode.SLIDE}/${wsGameResp.id}`, {
      ...wsGameResp,
      status: MultiPlayerGameStates.acceptBet,
    });
    this.socket.to(GameCode.SLIDE).emit(`${GameCode.SLIDE}/${MultiPlayerGameStates.acceptBet}`, {
      gameId: wsGameResp.id,
      numbers: wsGameResp.numbers,
      status: MultiPlayerGameStates.acceptBet,
      delay: 18000,
    });
    await this.slideGames.updateOne(
      { _id: wsGameResp.id },
      { status: MultiPlayerGameStates.acceptBet }
    );
    this.logger.info(
      "===SLIDE: game %s updated to bet accepting state ===",
      gameResp._id
    );
    // await this.timer(18000);

    let delay = 18000;
    const startTime = Date.now();
    this.cache.set(`${GameCode.SLIDE}/${wsGameResp.id}`, {
      ...wsGameResp,
      status: MultiPlayerGameStates.halt,
    });

    while (Date.now() - startTime < 18000) {
      // Perform some asynchronous operation here
      this.socket.to(GameCode.SLIDE).emit(`${GameCode.SLIDE}/${MultiPlayerGameStates.halt}`, {
        gameId: wsGameResp.id,
        numbers: wsGameResp.numbers,
        status: MultiPlayerGameStates.halt,
        delay: delay,
      });

      await this.timer(200); // Wait for 200ms
      delay = delay - 200;
      this.cache.set(`${GameCode.SLIDE}/activeGame`, {
        gameId: gameResp._id,
        gameEndIn: delay
      });
    }

    this.cache.set(`${GameCode.SLIDE}/${wsGameResp.id}`, {
      ...wsGameResp,
      status: MultiPlayerGameStates.starting,
    });

    //emit socket event for game starting and move game DB to runing state
    this.socket.to(GameCode.SLIDE).emit(`${GameCode.SLIDE}/${MultiPlayerGameStates.starting}`, {
      gameId: wsGameResp.id,
      numbers: wsGameResp.numbers,
      status: MultiPlayerGameStates.starting,
      delay: 2000
    });

    await this.timer(2000);

    //update game status to result in DB
    await this.slideGames.findOneAndUpdate(
      { _id: wsGameResp.id },
      { status: MultiPlayerGameStates.result }
    );

    //update cache with players joined the games
    const playerJoined = await this.gameModel.find({gameCode: GameCode.SLIDE, gameId: wsGameResp.id}).select({
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
          // payout: 0,
          // payoutMultiplier: 0,
          slideState: {targetMultiplier: (info?.state as SlidePlayerStatusInterface)?.targetMultiplier || 0}
        }
      ]
    }

    wsGameResp = {
      ...wsGameResp,
      status: MultiPlayerGameStates.result,
    }

    const _gameModes = [
      GameMode.ONE,
      GameMode.TWO,
      GameMode.THREE,
      GameMode.FIVE,
      GameMode.SEVEN,
    ];

    //Update Game to result state in cache and emit socket event
    this.logger.info(
      "===SLIDE: game %s updated to result state ===",
      gameResp._id
    );
    this.cache.set(`${GameCode.SLIDE}/${wsGameResp.id}`, wsGameResp);
    for (const _value of _gameModes) {
      this.socket.to(`${_value}/${GameCode.SLIDE}`).emit(
        `${GameCode.SLIDE}/${MultiPlayerGameStates.result}`,
        {
          gameId: wsGameResp.id,
          status: wsGameResp.status,
          multiplier: wsGameResp.multiplier[_value],
          numbers: wsGameResp.numbers,
          delay: 11000,
        }
      );
    }

    await this.timer(11000);
    await this._handlePlayerBets(wsGameResp.id);

    //Clear cache for game completed
    this.cache.del([
      `${GameCode.SLIDE}/${wsGameResp.id}`,
      `${GameCode.SLIDE}/activeGame`,
    ]);
    this.logger.info("===SLIDE: createGame ended ===");

    return {
      proceedNext: true,
      message: "",
    };
  }

  public async getUserSession(data: InitSchemaInterface) {
    this.logger.info("===SLIDE: getUserSession started ===");
    const rgsServiceInstance = Container.get(rgsService);
    const userServiceInstance = Container.get(userService);

    let playerInfo = await rgsServiceInstance.validateToken({
      token: data.token,
      gameCode: GameCode.SLIDE,
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
    let currGame: { gameId: string, gameEndIn: number } = this.cache.get(
      `${GameCode.SLIDE}/activeGame`
    );
    let activeGameInfo: WSSlideGameInterface;
    let activeGame = {};
    let gameUnderMaintenance = await this.slideHashModel.exists({isUsed: false});

    if (currGame?.gameId) {
      activeGameInfo = this.cache.get(`${GameCode.SLIDE}/${currGame.gameId}`);
      const playerJoined = await this.gameModel.find({gameCode: GameCode.SLIDE, gameId: currGame.gameId, gameMode: playerInfo.gameMode}).select({
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
        multiplier: [MultiPlayerGameStates.ended, MultiPlayerGameStates.result].includes(activeGameInfo?.status) ? activeGameInfo?.multiplier[playerInfo.gameMode] : null,
        gameEndIn: currGame.gameEndIn,
        players: playerJoined.reduce((map, curr) => {
          let _map = [...map];

          _map.push({
            ...curr,
            payout: [MultiPlayerGameStates.result, MultiPlayerGameStates.ended] ? curr.payout : 0,
            payoutMultiplier: [MultiPlayerGameStates.result, MultiPlayerGameStates.ended] ? curr.payoutMultiplier : 0,
            slideState: {targetMultiplier: (curr?.state as SlidePlayerStatusInterface)?.targetMultiplier || 0}
          })

          return _map
        }, []),
      };
    }

    // await this.gameModel.deleteMany({gameCode: GameCode.SLIDE})

    this.logger.info("===SLIDE: getUserSession ended===");
    return { ...playerInfo, gameCode: GameCode.SLIDE, activeGame, gameUnderMaintenance: !gameUnderMaintenance };
  }

  public async betPlace(data: SlideBetSessionInterface) {
    this.logger.info("===SLIDE: betPlace started ===");
    const rgsServiceInstance = Container.get(rgsService);

    let game: WSSlideGameInterface = this.cache.get(
      `${GameCode.SLIDE}/${data.gameId}`
    );

    if (!game) throw new Error(i18next.t("crash.invalidGameId"));
    if (![ MultiPlayerGameStates.acceptBet, MultiPlayerGameStates.halt].includes(game.status))
      throw new Error(i18next.t("crash.betNotAllowed"));

    const user = await this.userModel
      .findOne({ userId: data.userId, platformId: data.platformId, operatorId: data.operatorId, brandId: data.brandId })
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

    const betId = uuidv4();

    const { balance } = await rgsServiceInstance.debit({
      token: data.token,
      playerId: data.userId,
      amount: data.betAmount,
      betId,
      gameCode: GameCode.SLIDE,
    });

    let payout = 0, payoutMultiplier = 0;

    //update payout if player wins
    if(game.multiplier[data.gameMode] >= data.targetMultiplier) {
      payoutMultiplier = data.targetMultiplier;
      payout = data.betAmount * data.targetMultiplier;
    }

    const info = {
      token: data.token,
      gameCode: GameCode.SLIDE,
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
      operatorId: data.operatorId, 
      brandId: data.brandId,
      payout,
      payoutMultiplier,
      active: false,
      gameId: data.gameId,
      betStatus: BetStatus.debitSuccess,
      state: {
        targetMultiplier: data?.targetMultiplier || 0,
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
      gameCode: GameCode.SLIDE,
      gameMode: data.gameMode,
      slideState: {
        targetMultiplier: data?.targetMultiplier || 0,
      },
      date: info.date,
    };

    //Emit Soctket event for bet place as per by game Mode
    this.socket.to(`${data.brandId}/${data.gameMode}/${GameCode.SLIDE}`).emit(
      `${GameCode.SLIDE}/${SocketEvents.betPlaced}`,
      betResp
    );

    await this.gameModel.create(info);
    await this.userModel.updateOne(
      { _id: user._id },
      { $inc: { nonce: 1 } }
    );

    this.logger.info("===SLIDE: betPlace ended===");
    return betResp;
  }

  public async getBetInfo(data: BetInfo) {
    this.logger.info("===SLIDE: getBetInfo started for player %s===", data.userId);

    const resp = await this.gameModel
      .findOne({
        // userId: data.userId,
        betId: data.betId,
        gameCode: GameCode.SLIDE,
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

    let gameInfo = await this.slideGames.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(resp.gameId),
        },
      },
      {
        $lookup: {
          from: "slide_hashcodes",
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
          multiplier: 1,
          hashInfo: {
            hash: 1,
          },
          seedInfo: {
            seed: 1,
          },
        },
      },
    ]);
    this.logger.info("===SLIDE: getBetInfo ended===");

    return {
      ...resp,
      slideState: { ...resp.state },
      serverSeed: resp.serverSeed === user.serverSeed ? null : resp.serverSeed,
       //@ts-ignore
      seed: gameInfo[0]?.seedInfo?.seed,
       //@ts-ignore
      hash: gameInfo[0]?.hashInfo?.hash,
       //@ts-ignore
      multiplier: gameInfo[0]?.multiplier[data.gameMode]
    };
  }

  public async getSlideGameInfoById(data: PreviousSlideInfo) {
    this.logger.info("===SLIDE: getSlideGameInfoById started for player %s===", data.userId);
    const leaderboard = await this.gameModel
      .find({
        gameId: data.gameId,
        gameCode: GameCode.SLIDE,
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
      })
      .lean();

      let gameInfo = await this.slideGames.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(data.gameId),
          },
        },
        {
          $lookup: {
            from: "slide_hashcodes",
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
            multiplier: 1,
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

    this.logger.info("===SLIDE: getSlideGameInfoById started for player %s===", data.userId);

    return {
      leaderboard,
      round: gameInfo[0]?.round,
      date: gameInfo[0]?.createdAt,
      seed: gameInfo[0]?.seedInfo?.seed,
       //@ts-ignore
      hash: gameInfo[0]?.hashInfo?.hash,
       //@ts-ignore
      multiplier: gameInfo[0]?.multiplier[data.gameMode],
      gameCode: data.gameCode
    };
  }
}
