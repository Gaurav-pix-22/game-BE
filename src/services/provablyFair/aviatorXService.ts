/**
 * @dev This file contains the logic to generate seeds and hash seed aviator.
 */
import { Inject, Service } from "typedi";
import crypto from "crypto";
import { maxMultiplierCap, houseEdges } from "./constants";
import _, { round } from "lodash";

@Service()
export default class GenerateSeed {
  constructor(@Inject("logger") private logger) {}

  private generateRandomString = (length: number) => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  public generateSeedsAndHashes = (initialSeed: string, numSeeds: number) => {
    const resp = [];

    for (let i = 0; i < numSeeds; i++) {
      const serverSeed = i=== 0 ? initialSeed : this.generateRandomString(16);
      const hashedServerSeed = crypto.createHash("sha256").update(serverSeed).digest("hex");

      resp.push({ serverSeed, hashedServerSeed, order: i + 1, isUsed: false });
    }

    return resp;
  };

  public async generateGameOutcomes(
    serverCode: string,
    playerClientCode: string
  ): Promise<{outcomes: object, hash: string}> {
    const hash = await this.generateHash(serverCode.concat(playerClientCode));
    const hexValue = hash.slice(0, 13);
    const decimalValue = parseInt(hexValue, 16);

    let outcomes = {};

    for (let i = 0; i < houseEdges.length; i++) {
      let temp;
      if (parseInt(hash, 16) % (houseEdges[i]*10) === 0) {
        temp = 1;
      } else {
        const e = 2 ** 52;
        temp = Number((100 * e - decimalValue) / (e - decimalValue) / 100);
      }

      outcomes[houseEdges[i]] = maxMultiplierCap["AVIATORX"] > 0 && maxMultiplierCap["AVIATORX"]<temp ? maxMultiplierCap["AVIATORX"] : temp;   
    }

    return {outcomes, hash};
  }

  public async generateHash(
    hash: string,
    hmac: string = "sha512"
  ): Promise<string> {
    // genarate a hmac sha512 hash of the server seed.
    const _hash = crypto.createHash(hmac);
    _hash.update(hash);
    return _hash.digest("hex");
  }
}
