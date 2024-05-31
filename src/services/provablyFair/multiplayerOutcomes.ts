/**
 * @dev This file contains the logic for the multiplayer outcomes like Crash and Slide.
 */
import { Inject, Service } from "typedi";
import crypto from "crypto";
import { houseEdgeConversion, maxRawOutcomes, houseEdges, maxMultiplierCap } from "./constants";
import _ from "lodash";

@Service()
export default class provablyFair {
  constructor(@Inject("logger") private logger) {}

  public async generateGameOutcomes(
    hashCode: string,
    Seed: string,
    game: string
  ): Promise<object> {
    const hash = await this.generateHash(hashCode, Seed);
    const hashInDecimal = [];
    for (let i = 0; i < 32; i++) {
      hashInDecimal.push(Number(hash[i]));
    }
    //  convert the decimal bytes array to a floating point numbers array
    let rawOutcome = 0;
    rawOutcome = await this.bytesToFloatingPoint(hashInDecimal.slice(0, 4));
    // return gameOutcomes.slice(0, totalOutcomes[game]);
    const edgedOutcome = await this.rawToEdgedOutcome(rawOutcome, game);
    return edgedOutcome;
  }

  public async generateHash(
    serverSeed: string,
    clientSeed: string
  ): Promise<Buffer> {
    // genarate a hmac sha256 hash of the server seed.
    const hash = crypto.createHmac("sha256", serverSeed);
    // update client seed and nonce and currentRound
    hash.update(`${clientSeed}`);
    return hash.digest();
  }

  public async bytesToFloatingPoint(bytes: any): Promise<number> {
    // convert bytes to floating point
    const rand = _.chunk(bytes, 4).map((_chunk) => {
      let index = 3;
      return Number(
        _chunk.reduce((result, value) => {
          const multiplier = 256 ** index;
          const partialResult = Number(value) * multiplier;
          index -= 1;
          return Number(result) + partialResult;
        }, 0)
      );
    });
    return rand[0];
  }

  // raw to edged outcome
  public async rawToEdgedOutcome(
    rawOutcome: number,
    game: string
  ): Promise<object> {
    const maxRawOutcome = maxRawOutcomes[game];
    const outcomes = {};
    for (let i = 0; i < houseEdges.length; i++) {
      let _temp = (maxRawOutcome / (rawOutcome + 1)) *
      (1 - houseEdgeConversion[houseEdges[i]]);

      outcomes[houseEdges[i]] = maxMultiplierCap[game] > 0 && maxMultiplierCap[game]<_temp ? maxMultiplierCap[game] : _temp;   
    }
    // const outcome =
    //   (maxRawOutcome / (rawOutcome + 1)) * (1 - houseEdgeConversion[houseEdge]);
    return outcomes;
  }

  // generate dummy outcomes for slide
  public async slideDummyOutcomes( count: number): Promise<any> {
    // generate a random 32 Byte hash and seed
    const hashCode = crypto.randomBytes(32).toString('hex');
    const finalResult = [];
    for(let i=0; i<count; i++) {
      const Seed = crypto.randomBytes(32).toString('hex');
      const result = await this.generateGameOutcomes(hashCode, Seed, "SLIDE");
      finalResult.push(result['1']);
    }
    return finalResult;
  }
}
