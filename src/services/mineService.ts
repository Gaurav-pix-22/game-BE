import { GameCode, PlayMode, SocketEvents, BetStatus } from "../config/constant";
import moment from "moment";
import { Server } from "socket.io";
import Container from "typedi";
import i18next, { use } from "i18next";
import CommonService from "./common";
import { v4 as uuidv4 } from "uuid";
import { Inject, Service } from "typedi";
import gameOutcomes from "./provablyFair/gameOutcomes";
import {
  BetSessionInterface,
  InitSchemaInterface,
  NextMineInterface,
  CashoutInterface,
  BetInfo,
  MinegameState
} from "./../interfaces/mine";
import {UserDBGameSessionInterface} from "./../interfaces/common";
import userService from "./userService";
import rgsService from "./rgsService";
import gameConfig from "../config/math/mine";

@Service()
export default class MineService extends CommonService {
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
      gameCode: GameCode.MINE,
    });

    let activeBet: UserDBGameSessionInterface;

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

    if(isExistingUser) {
      this.logger.info("===getUserSession: getting active bet for user %s===", playerInfo.playerId);
      activeBet = await this.gameModel
        .findOne({ userId: playerInfo.playerId, active: true, gameCode: GameCode.MINE, gameMode: playerInfo.gameMode })
        .select({
          betId: 1,
          state: 1,
          payout: 1,
          payoutMultiplier: 1,
          betAmount: 1,
        })
        .lean();
    }

    this.logger.info("===getUserSession ended===");
    return {
      ...playerInfo,
      minePaytable: gameConfig[playerInfo.gameMode].multiplierMap,
      gameCode: GameCode.MINE,
      activeBet:
        activeBet && Object.keys(activeBet)?.length > 0
          ? { ...activeBet, betAmount: activeBet.betAmount, mineState: { ...activeBet.state, mines: null } }
          : {},
    };
  }

  public async updatePlaysession(data: NextMineInterface) {
    this.logger.info("===updatePlaysession started for user %s===", data.userId);
    const session = await this.gameModel
      .findOne({ userId: data.userId, betId: data.betId, active: true })
      .select({ state: 1, payout: 1, payoutMultiplier: 1, betAmount: 1, date: 1, gameMode: 1 })
      .lean();

    if(!session?._id) {
      throw new Error((i18next.t('mine.invalidBet')));
    }

    if((session?.state as MinegameState)?.rounds?.find((el) => el?.field === data.variable[0]))
      throw new Error((i18next.t('mine.fieldSelected')));

    let updatedSession: UserDBGameSessionInterface;
    const isMineSelected = (session.state as MinegameState).mines.includes(data.variable[0]);
    let isGameEnded: Boolean = false;

    if(isMineSelected) {
      this.logger.info("===updatePlaysession: Game crashed===");

      //@ts-ignore
      updatedSession = {
        state: {
          ...session.state,//@ts-ignore
          rounds: [...session.state.rounds, {field: data.variable[0], payoutMultiplier: 0}]
        },
        payout: 0,
        payoutMultiplier: 0
      }
    } else {
      let _payout = gameConfig[session.gameMode].multiplierMap[(session?.state as MinegameState)?.mineCount - 1][(session?.state as MinegameState)?.rounds?.length];

      if(((session?.state as MinegameState)?.rounds?.length + (session?.state as MinegameState)?.mineCount + 1) === 25) isGameEnded = true;
      
      //@ts-ignore
      updatedSession = {
        payout: _payout.multiplier * session.betAmount,
        payoutMultiplier: _payout.multiplier,
        state: {
          ...session.state,//@ts-ignore
          rounds: [...session.state.rounds, {field: data.variable[0], payoutMultiplier: _payout.multiplier}]
        }
      }
    }

    await this.gameModel.findOneAndUpdate({_id: session._id}, {...updatedSession});

    if(isGameEnded || isMineSelected) {
      this.logger.info("===updatePlaysession: Game session comes to an end===");

      return await this.cashOut({
        token: data.token,
        gameCode: GameCode.MINE,
        gameMode: session.gameMode,
        userId: data.userId,
        betId: data.betId
      })
    }


    this.logger.info("===updatePlaysession ended===");
    return {
      gameCode: GameCode.MINE,
      betId: data.betId,
      ...updatedSession,
      mineState: {
        ...updatedSession.state,
        mines: null,
      },
    };
  }

  public async betPlace(data: BetSessionInterface) {
    this.logger.info("===betPlace started for user %s===", data.userId);
    
    const gameOutcomesInstance = Container.get(gameOutcomes);
    const rgsServiceInstance = Container.get(rgsService);
   
    const user = await this.userModel.findOne({userId: data.userId}).select({_id: 1, serverSeed: 1,clientSeed: 1, hashedServerSeed: 1, nonce: 1}).lean();
    const isActiveBet = await this.gameModel.exists({userId: data.userId, active: true, gameCode: GameCode.MINE, gameMode: data.gameMode});

    if(!user._id || !user?.hashedServerSeed) {
      throw new Error(i18next.t('general.invalidUserSeed'));
    }

    if(isActiveBet) {
      throw new Error(i18next.t('mine.activeBet'));
    }

    const generatedTarget = await gameOutcomesInstance.generateGameOutcomes(user.serverSeed, user.clientSeed, user.nonce, GameCode.MINE);
  
    const initialTiles = Array.from(Array(25).keys());
    const mines = generatedTarget.map((index) => {
      const mine_index = Math.floor(index); 
      const mine_location = initialTiles[mine_index];
      initialTiles.splice(index, 1);
      return mine_location;
    });

    const minesPositions = mines.slice(0, data.mineCount);
    const betId = uuidv4();
    const date = new Date();
    let balance = null;

    const debitResp = await rgsServiceInstance.debit({
      token: data.token,
      playerId: data.userId,
      amount: data.betAmount,
      betId,
      gameCode: GameCode.MINE
    })
    balance = debitResp.balance;

    let payout = 0, payoutMultiplier = 0, rounds = [];

    if(data.playMode === PlayMode.auto) {
      this.logger.info("===betPlace autoplay executions starts===");

      let isCrashed = data.variable.some(e => minesPositions.includes(e));
      let _payout = gameConfig[data.gameMode].multiplierMap[data.mineCount - 1];

      this.logger.info("===betPlace autoplay crashed ===");
      if(isCrashed) {
        payout = 0;
        payoutMultiplier = 0;
        rounds = data.variable.reduce((map, curr, index) => {
          if (index === 0)
            return [
              ...map,
              {
                field: curr,
                payoutMultiplier: minesPositions.includes(curr)
                  ? 0
                  : _payout[index].multiplier,
              },
            ];
          
          return [
            ...map,
            {
              field: curr,
                payoutMultiplier: minesPositions.includes(curr) || !!!map[index - 1].payoutMultiplier
                  ? 0
                  : _payout[index].multiplier,
            }
          ]
        }, []);
      } else {
        rounds = data.variable.reduce((map, curr, index) => {
          return [
            ...map,
            {
              field: curr,
              payoutMultiplier: _payout[index].multiplier
            }
          ]
        }, []);

      
        payout = _payout[rounds.length - 1].multiplier * data.betAmount;
        payoutMultiplier = _payout[rounds.length - 1].multiplier;
      }

      this.logger.info("===betPlace autoplay calling credit call for bet id %s ===", betId);
      const creditResp = await rgsServiceInstance.credit([{
        token: data.token,
        playerId: data.userId,
        amount: payout,
        betId,
        gameCode: GameCode.MINE,
        clientSeed: user.clientSeed,
        serverSeed: user.serverSeed,
        hashedServerSeed: user.hashedServerSeed,
        nonce: user.nonce,
        payoutMultiplier
      }])
      balance = creditResp[0].balance
      if(creditResp[0]?.error) throw new Error(creditResp[0]?.description || "credit internal error")

      this.socket.emit(`${data.gameMode}/${SocketEvents.cashedout}`, {
        userId: data.userId,
        betId,
        payout,
        payoutMultiplier,
        balance,
        betAmount: data.betAmount,
        currency: data.currency,
        gameCode: GameCode.MINE,
        date,
      });
    }
  
    await this.gameModel.create({
      userId: data.userId,
      gameCode: GameCode.MINE,
      gameMode: data.gameMode,
      currency: data.currency,
      betAmount: data.betAmount,
      mineCount: data.mineCount,
      hashedServerSeed: user.hashedServerSeed,
      clientSeed: user.clientSeed,
      serverSeed: user.serverSeed,
      nonce: user.nonce,
      token: data.token,
      betId,
      payout,
      payoutMultiplier,
      active: data.playMode === PlayMode.bet,
      betStatus: data.playMode === PlayMode.bet ? BetStatus.debitSuccess : BetStatus.creditSuccess,
      state: {
        rounds,
        mineCount: data.mineCount,
        mines: minesPositions
      },
      date
    });
    await this.userModel.updateOne({_id: user._id}, {nonce: user.nonce + 1})
    
    this.logger.info("===betPlace ended===");
    return {
      gameCode: GameCode.MINE,
      betId,
      payout,
      payoutMultiplier,
      balance,
      date,
      betAmount: data.betAmount,
      mineState: {
        rounds,
        mineCount: data.mineCount,
        mines: data.playMode === PlayMode.bet ? null : minesPositions,
      },
    };
  }

  public async cashOut(data: CashoutInterface) {
    this.logger.info("===cashOut started for user id %s and bet id %s ===", data.userId, data.betId);
    const rgsServiceInstance = Container.get(rgsService);

    const session = await this.gameModel
      .findOne({ userId: data.userId, betId: data.betId, active: true })
      .select({ state: 1, payout: 1, payoutMultiplier: 1, betAmount: 1, date: 1, currency: 1, clientSeed: 1, serverSeed: 1, hashedServerSeed: 1, nonce: 1,})
      .lean();
    
    if(!session?._id) {
      throw new Error((i18next.t('mine.invalidBet')));
    }

    const credResp = await rgsServiceInstance.credit([{
      token: data.token,
      playerId: data.userId,
      amount: session.payout,
      betId: data.betId,
      gameCode: GameCode.MINE,
      clientSeed: session.clientSeed,
      serverSeed: session.serverSeed,
      hashedServerSeed: session.hashedServerSeed,
      nonce: session.nonce,
      payoutMultiplier: session.payoutMultiplier
    }])
    const {balance} = credResp[0];
    if(credResp[0]?.error) throw new Error(credResp[0]?.description || "credit internal error")

    await this.gameModel.findByIdAndUpdate({_id: session._id}, {active: false, betStatus: BetStatus.creditSuccess});

    this.socket.emit(`${data.gameMode}/${SocketEvents.cashedout}`, {
      userId: data.userId,
      betId: data.betId,
      payout: session.payout,
      payoutMultiplier: session.payoutMultiplier,
      balance,
      betAmount: session.betAmount,
      currency: session.currency,
      gameCode: GameCode.MINE,
      date: session.date,
    });

    this.logger.info("===cashOut ended===");
    return {...session, mineState: {...session.state}, betId: data.betId, gameCode: GameCode.MINE, balance};
  }

  public async getBetInfo(data: BetInfo) {
    this.logger.info("===getBetInfo started for player %s===", data.userId);

    const resp = await this.gameModel
      .findOne({
        // userId: data.userId,
        betId: data.betId,
        gameCode: GameCode.MINE,
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
    return {...resp, mineState: resp.state, serverSeed: resp.serverSeed === user.serverSeed ? null : resp.serverSeed};
  }
}
