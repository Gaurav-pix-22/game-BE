import i18next from "i18next";
import axios from "axios";
import { Inject, Service } from "typedi";
import config from "../config";
import {
  InitInterface,
  DebitInterface,
  CreditInterface,
} from "../interfaces/rgs";
import CommonService from "./common";
@Service()
export default class RgsService extends CommonService {
  constructor(@Inject("logger") private logger) {
    super();
  }

  public async validateToken(request: InitInterface) {
    this.logger.info("===validateToken for the game %s===", request.gameCode);

    if (!request.token) throw new Error(i18next.t("general.invalidToken"));

    const obj = {
      token: request.token,
    };

    let res = await axios({
      method: "post",
      url: `${config.rgsUrl}/demo/init`,
      data: obj,
    });

    this.logger.info("===validateToken call ended%s===");
    return {
      playerId: res?.data?.userId,
      balance: res?.data?.balance,
      currency: res?.data?.currency,
      language: res?.data?.language,
      gameMode: res?.data?.gameMode || "2",
      platformId: res?.data?.platformId || "",
      operatorId: res?.data?.operatorId || "",
      brandId:res?.data?.brandId || "",
    };
  }

  public async debit(request: DebitInterface) {
    this.logger.info(
      "===rgs debit call for player id %s and betId %s and debit amount is %s===",
      request.playerId,
      request.betId,
      request.amount
    );

    if (!request.token) throw new Error(i18next.t("general.invalidToken"));

    let obj = {
      token: request.token,
      betAmount: request.amount,
      roundId: request.betId,
    };

    let res = await axios({
      method: "post",
      url: `${config.rgsUrl}/demo/bet`,
      data: obj,
    });

    this.logger.info("===rgs debit call call ended%s===");

    return res.data;
  }

  public async refund(request: DebitInterface) {
    this.logger.info(
      "===rgs refund call for player id %s and betId %s and refund amount is %s===",
      request.playerId,
      request.betId,
      request.amount
    );

    if (!request.token) throw new Error(i18next.t("general.invalidToken"));

    let obj = {
      token: request.token,
      roundId: request.betId,
    };

    let res = await axios({
      method: "post",
      url: `${config.rgsUrl}/demo/refund`,
      data: obj
    });

    this.logger.info("===rgs refund call call ended%s===");

    return res.data;
  }

  public async credit(request: CreditInterface[]) {
    this.logger.info(
      "===rgs credit call for player ids %s===",
      request.map((el) => el.playerId).join(", ")
    );

    const obj = request.map((el) => {
      let _temp = {
        token: el.token,
        winAmount: el.amount,
        roundId: el.betId,
        clientSeed: el.clientSeed,
        serverSeed: el.serverSeed,
        hashedServerSeed: el.hashedServerSeed,
        payoutMultiplier: el.payoutMultiplier,
      };

      //@ts-ignore
      // if (el?.roundId) _temp = { ..._temp, roundId: el?.roundId };

      return _temp;
    });

    // return request.reduce((map, curr) => {
    //   return [...map, { balance: 1000, transaction_id: curr.betId }];
    // }, []);

    if (!obj?.length) {
      return [];
    }

    // const nonce = Date.now();
    // const hash = crypto
    //   .createHash("md5")
    //   .update(
    //     `/rgs/game/result${nonce}${JSON.stringify(obj)}${config.secretKey}`
    //   )
    //   .digest("hex");

    const res = await axios({
      method: "post",
      url: `${config.rgsUrl}/demo/win`,
      data: obj,
      // headers: {
      //   nonce,
      //   hash,
      // },
    });

    // if (res?.data?.error) {
    //   this.logger.info("===rgs credit call failed%s===");
    //   throw new Error(res?.data?.description);
    // }

    this.logger.info("===rgs credit call call ended%s===");

    //resp data structure
    // {
    //   transaction_id: '',
    //   error: '',
    //   description: '',
    //   balance: ,
    //   player_id: ''
    // }

    return res.data || [];
  }
}
