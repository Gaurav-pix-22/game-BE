import { Inject, Service } from 'typedi';
import crypto from 'crypto';
import _ from 'lodash';
import { gameOutcomeMultiplier, totalOutcomes, maxRawOutcomes, outComeCutoff } from './constants';

@Service()
export default class provablyFair {
  constructor(@Inject('logger') private logger) {}

  public async generateGameOutcomes(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    game: string,
  ): Promise<number[]>
  {
    const hashesRequired = Math.ceil(totalOutcomes[game] / 8);
    const hashes = [];
    for (let i = 0; i < hashesRequired; i++) {
      const hash = await this.generateHash(serverSeed, clientSeed, nonce, i);
      hashes.push(hash);
    }
    const hashesInDecimal = [].concat(
      ...hashes.map((hash) => {
        let index = 0;
        const decimalNumbers = [];
        while (index < 32) {
          decimalNumbers.push(Number(hash[index]));
          index += 1;
        }
        return decimalNumbers;
      }),
    );
    //  convert the decimal bytes array to a floating point numbers array
    let gameOutcomes = [];
    if (game === 'MINES') {
      gameOutcomes = await this.bytesToFloatingPoint2(hashesInDecimal, game);
    }
    else if (game === 'LIMBO') {
      gameOutcomes = await this.bytesToFloatingPoint1(hashesInDecimal, game);
      const finalOutcome = await this.rawToEdgedOutcome(gameOutcomes[0], game);
      return [finalOutcome];
    }
    else {
      gameOutcomes = await this.bytesToFloatingPoint1(hashesInDecimal, game);
    }
    return gameOutcomes.slice(0, totalOutcomes[game]);
  }

  public async generateHash(serverSeed: string, clientSeed: string, nonce: number, cursor: number): Promise<Buffer> {
    // genarate a hmac sha256 hash of the server seed.
    const hash = crypto.createHmac('sha256', serverSeed);
    // update client seed and nonce and currentRound
    hash.update(`${clientSeed}:${nonce}:${cursor}`);
    return hash.digest();
  }

  // bytesToFloatingPoint1 is used for games dice, hilo, 
  public async bytesToFloatingPoint1(bytes: any, game: string): Promise<number[]> {
    // convert bytes to floating point
    const rand = _.chunk(bytes, 4).map((_chunk) => {
      return (
        Number(
          _chunk.reduce((result, value, index) => {
            const divider = 256 ** (index + 1);
            const partialResult = Number(value) / divider;
            return Number(result) + partialResult;
          }, 0),
        ) * gameOutcomeMultiplier[game]
      );
    });
    return rand;
  }

  // bytesToFloatingPoint2 used for games like mine
  public async bytesToFloatingPoint2(bytes: any, game: string): Promise<number[]> {
    // mines game have a variable game outcome multiplier, starts from 25 and decreases by 1 for each outcome
    let variableMultiplier = gameOutcomeMultiplier[game] + 1;
    const rand = _.chunk(bytes, 4).map((_chunk) => {
      variableMultiplier -= 1;
      return (
        Number(
          _chunk.reduce((result, value, index) => {
            const divider = 256 ** (index + 1);
            const partialResult = Number(value) / divider;
            return Number(result) + partialResult;
          }, 0),
        ) * variableMultiplier
      );
    });
    return rand;
  }

  // raw to edged outcome
  public async rawToEdgedOutcome(rawOutcome: number, game: string): Promise<number> {
    const maxRawOutcome = maxRawOutcomes[game];
    const outcome = (maxRawOutcome / (rawOutcome + 1)) * outComeCutoff[game];
    return outcome;
  }

}
