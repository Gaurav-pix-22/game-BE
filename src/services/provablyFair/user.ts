import { Inject, Service } from 'typedi';
import crypto from 'crypto';

@Service()
export default class UserSeeds {
  constructor(@Inject('logger') private logger) {}

  public generateNewServerSeed(): { serverSeed: string; hashedServerSeed: string } {
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256');
    hash.update(serverSeed);
    const hashedServerSeed = hash.digest('hex');
    return { serverSeed, hashedServerSeed };
  }
}
