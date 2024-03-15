import { round } from './../interfaces/hilo';
import i18next from "i18next";
import crypto from "crypto";
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

    return {
      playerId: "112233",
      balance: 1000,
      currency: "USD",
      language: "en",
      gameMode: "2",
    };

    const obj = { token: request.token };
    const nonce = Date.now();
    const hash = crypto
      .createHash("md5")
      .update(
        `/rgs/game/validateToken${nonce}${JSON.stringify(obj)}${
          config.secretKey
        }`
      )
      .digest("hex");

    const res = await axios({
      method: "post",
      url: `${config.rgsUrl}/validateToken`,
      data: obj,
      headers: {
        nonce,
        hash,
      },
    });

    if (res?.data?.error) {
      this.logger.info("===validateToken failed%s===");
      throw new Error(res?.data?.description);
    }

    this.logger.info("===validateToken call ended%s===");
    return {
      playerId: res?.data?.player_id,
      balance: res?.data?.balance,
      currency: res?.data?.currency,
      language: res?.data?.language,
      gameMode: res?.data?.game_mode || "2",
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
      amount: request.amount,
      gameCode: request.gameCode,
      transaction_id: request.betId,
    };

    //@ts-ignore
    if(request?.roundId) obj = {...obj, round_id: request.roundId};

    return {balance: 1000 - request.amount, transaction_id: request.betId}

    const nonce = Date.now();
    const hash = crypto
      .createHash("md5")
      .update(`/rgs/game/bet${nonce}${JSON.stringify(obj)}${config.secretKey}`)
      .digest("hex");

    const res = await axios({
      method: "post",
      url: `${config.rgsUrl}/bet`,
      data: obj,
      headers: {
        nonce,
        hash,
      },
    });

    if (res?.data?.error) {
      this.logger.info("===rgs debit call failed%s===");
      throw new Error(res?.data?.description);
    }

    this.logger.info("===rgs debit call call ended%s===");

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
        amount: el.amount,
        gameCode: el.gameCode,
        transaction_id: el.betId,
        clientSeed: el.clientSeed,
        serverSeed: el.serverSeed,
        hashedServerSeed: el.hashedServerSeed,
        nonce: el?.nonce?.toString() || "",
        payoutMultiplier: el.payoutMultiplier
      };

      //@ts-ignore
      if(el?.roundId) _temp = {..._temp, round_id: el?.roundId}

      return _temp;
    });

    return request.reduce((map, curr) => {
      return [
        ...map,
        {balance: 1000, transaction_id: curr.betId}
      ]
    }, [])

    const nonce = Date.now();
    const hash = crypto
      .createHash("md5")
      .update(
        `/rgs/game/result${nonce}${JSON.stringify(obj)}${config.secretKey}`
      )
      .digest("hex");

    const res = await axios({
      method: "post",
      url: `${config.rgsUrl}/result`,
      data: obj,
      headers: {
        nonce,
        hash,
      },
    });

    if (res?.data?.error) {
      this.logger.info("===rgs credit call failed%s===");
      throw new Error(res?.data?.description);
    }

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
