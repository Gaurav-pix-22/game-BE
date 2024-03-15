/**
 * @dev This file contains the logic to generate hashes for the crash and slide games. 
 */
import { Inject, Service } from 'typedi';
import crypto from 'crypto';

@Service()
export default class GenerateHashes {
  constructor(@Inject('logger') private logger) {}

  public async generateHashes(initialHash: string, totalHashes: number): Promise<string[]> {
    let i = totalHashes;
    let tempHash = initialHash;
    let hashes = [];
    while(i>0){
        const hash = await this.generateHash(tempHash);
        hashes.push(hash);
        tempHash = hash;
        i--;
    }
    return hashes;
  }

  public async generateHash(prevHash: string): Promise<string> {
    // genarate a hmac sha256 hash of the server seed.
    const hash = crypto.createHash('sha256');
    hash.update(prevHash);
    return hash.digest('hex');
  }
}
