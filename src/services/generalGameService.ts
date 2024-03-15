import {
  AllBetsInterface,
  PlayerBetsInterface,
  PrevGameInfo,
} from "../interfaces/common";
import moment from "moment";
import i18next from "i18next";
import { MultiPlayerGameStates, GameCode, BetStatus } from "../config/constant";
import CommonService from "./common";
import { Inject, Service } from "typedi";

@Service()
export default class GameService extends CommonService {
  constructor(
    @Inject("logger") private logger,
    @Inject("userModel") private userModel: Models.UserModel,
    @Inject("gameModel") private gameModel: Models.GameModel,
    @Inject("crashGames") private crashGames: Models.CrashHashModel,
    @Inject("slideGames") private slideGames: Models.SlideGameModel
  ) {
    super();
  }

  public async getAllBets(data: AllBetsInterface) {
    this.logger.info("===getAllBets started ===");
    const pageOptions = {
      page: data?.page || 0,
      limit: data?.limit || 20,
      orderBy: data?.orderBy || "desc",
    };

    let startOfMonth = moment().startOf("month");
    let endOfMonth = moment().endOf("month");

    const resp = await this.gameModel
      .find({
        date: {
          //@ts-ignore
          $gte: new Date(startOfMonth),
          //@ts-ignore
          $lte: new Date(endOfMonth),
        },
        gameMode: data.gameMode,
        betStatus: {$nin: [BetStatus.debitSuccess]}
      })
      .select({
        userId: 1,
        currency: 1,
        betAmount: 1,
        betId: 1,
        payout: 1,
        payoutMultiplier: 1,
        date: 1,
        gameCode: 1,
      })
      .skip(pageOptions.page * pageOptions.limit)
      .limit(pageOptions.limit) //@ts-ignore
      .sort({ date: pageOptions.orderBy })
      .lean();

    const totalCount = await this.gameModel.count({
      date: {
        //@ts-ignore
        $gte: new Date(startOfMonth),
        //@ts-ignore
        $lte: new Date(endOfMonth),
      },
    });

    this.logger.info("===getAllBets ended===");
    return { data: resp, totalCount };
  }

  public async getPlayerBetHistory(data: PlayerBetsInterface) {
    this.logger.info("===getPlayerBetHistory started ===");

    const pageOptions = {
      page: data?.page || 0,
      limit: data?.limit || 20,
      orderBy: data?.orderBy || "desc",
    };

    let startOfMonth = moment().startOf("month");
    let endOfMonth = moment().endOf("month");

    const resp = await this.gameModel
      .find({
        userId: data.userId,
        date: {
          //@ts-ignore
          $gte: new Date(startOfMonth),
          //@ts-ignore
          $lte: new Date(endOfMonth),
        },
        gameMode: data.gameMode,
        betStatus: {$nin: [BetStatus.debitSuccess]}
      })
      .select({
        userId: 1,
        currency: 1,
        betAmount: 1,
        betId: 1,
        payout: 1,
        payoutMultiplier: 1,
        date: 1,
        gameCode: 1,
      })
      .skip(pageOptions.page * pageOptions.limit)
      .limit(pageOptions.limit) //@ts-ignore
      .sort({ date: pageOptions.orderBy })
      .lean();

    const totalCount = await this.gameModel.count({
      userId: data.userId,
      date: {
        //@ts-ignore
        $gte: new Date(startOfMonth),
        //@ts-ignore
        $lte: new Date(endOfMonth),
      },
    });

    const user = await this.userModel
      .findOne({ userId: data.userId })
      .select({ serverSeed: 1 });

    this.logger.info("===getPlayerBetHistory ended===");
    return {
      data: resp.map((el) => {
        return {
          ...el,
          serverSeed: el.serverSeed === user.serverSeed ? null : el.serverSeed,
        };
      }),
      totalCount,
    };
  }

  public async getPreviousGameInfo(data: PrevGameInfo) {
    this.logger.info(
      "===getPreviousGameInfo started  for %s===",
      data.gameCode
    );
    const pageOptions = {
      page: data?.page || 0,
      limit: data?.limit || 10,
      orderBy: data?.orderBy || "desc",
    };

    let startOfDay = moment().startOf("day");
    let endOfDay = moment().endOf("day");

    let resp, totalCount, games;

    switch (data.gameCode) {
      case GameCode.CRASH:
        resp = await this.crashGames
          .find({
            createdAt: {
              //@ts-ignore
              $gte: new Date(startOfDay),
              //@ts-ignore
              $lte: new Date(endOfDay),
            },
            status: MultiPlayerGameStates.ended,
          })
          .select({
            _id: 1,
            status: 1,
            round: 1,
            crashMultiplier: 1,
            createdAt: 1,
          })
          .skip(pageOptions.page * pageOptions.limit)
          .limit(pageOptions.limit) //@ts-ignore
          .sort({ createdAt: pageOptions.orderBy })
          .lean();

        totalCount = await this.crashGames.count({
          createdAt: {
            //@ts-ignore
            $gte: new Date(startOfDay),
            //@ts-ignore
            $lte: new Date(endOfDay),
          },
          status: MultiPlayerGameStates.ended,
        });

        games = resp.reduce((map, curr) => {
          return [
            ...map,
            {
              gameId: curr?._id,
              //@ts-ignore
              status: curr?.status,
              //@ts-ignore
              round: curr?.round,
              //@ts-ignore
              multiplier: curr?.crashMultiplier[data.gameMode],
              //@ts-ignore
              date: curr?.createdAt,
            },
          ];
        }, []);
        break;
      case GameCode.SLIDE:
        resp = await this.slideGames
          .find({
            createdAt: {
              //@ts-ignore
              $gte: new Date(startOfDay),
              //@ts-ignore
              $lte: new Date(endOfDay),
            },
            status: MultiPlayerGameStates.ended,
          })
          .select({
            _id: 1,
            status: 1,
            round: 1,
            multiplier: 1,
            createdAt: 1,
          })
          .skip(pageOptions.page * pageOptions.limit)
          .limit(pageOptions.limit) //@ts-ignore
          .sort({ createdAt: pageOptions.orderBy })
          .lean();

        totalCount = await this.slideGames.count({
          createdAt: {
            //@ts-ignore
            $gte: new Date(startOfDay),
            //@ts-ignore
            $lte: new Date(endOfDay),
          },
          status: MultiPlayerGameStates.ended,
        });

        games = resp.reduce((map, curr) => {
          return [
            ...map,
            {
              gameId: curr?._id,
              //@ts-ignore
              status: curr?.status,
              //@ts-ignore
              round: curr?.round,
              //@ts-ignore
              multiplier: curr?.multiplier[data.gameMode],
              //@ts-ignore
              date: curr?.createdAt,
            },
          ];
        }, []);
        break;
      default:
        throw new Error(i18next.t("general.invalidGamecode"));
    }

    this.logger.info("===getPreviousGameInfo started ===", data.gameCode);

    return { games, totalCount, gameCode: data.gameCode };
  }
}
