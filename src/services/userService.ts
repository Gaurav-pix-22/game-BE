import Container from "typedi";
import rgsService from "./rgsService";
import i18next, { exists, use } from "i18next";
import CommonService from "./common";
import { Inject, Service } from "typedi";
import UserSeeds from "./provablyFair/user";
import GenerateHashes from "./provablyFair/generateHashes";
import provablyFair from "./provablyFair/multiplayerOutcomes";
import { GameCode } from "../config/constant";
import gameOutcomes from "./provablyFair/gameOutcomes";
import multiplayerOutcome from "./provablyFair/multiplayerOutcomes";
import aviatorXProvablyService from "./provablyFair/aviatorXService";
import {
  addOrUpdateUserInterface,
  getServerSeedInterface,
  getUserSeedsInterface,
  InitSchemaInterface,
} from "../interfaces/userInterface";
import { HashcodeInterface } from "../interfaces/common";
import hiloMath from "../config/math/hilo";
import diamondMath from "../config/math/diamond";
import plinkoMath from "../config/math/plinko";

@Service()
export default class UserService extends CommonService {
  constructor(
    @Inject("logger") private logger,
    @Inject("userModel") private userModel: Models.UserModel,
    @Inject("crashHashModel") private crashHashModel: Models.CrashHashModel,
    @Inject("aviatorXServerModel")
    private aviatorXServerModel: Models.AviatorXServerModel,
    @Inject("slideHashModel") private slideHashModel: Models.SlideHashModel
  ) {
    super();
  }

  //Temporary service needs to be removed later.
  public async validateUserSession(data: InitSchemaInterface) {
    this.logger.info("===validateUserSession started ===");
    const rgsServiceInstance = Container.get(rgsService);

    let playerInfo = await rgsServiceInstance.validateToken({
      token: data.token,
      gameCode: GameCode.DICE,
    });

    this.logger.info("===validateUserSession ended===");
    return {
      ...playerInfo,
    };
  }

  //Temporary management service needs to be removed later.
  public async generateHashCodes(initialHash: string, gameCode: GameCode) {
    // await this.generateHashCodes('test', GameCode.CRASH);

    this.logger.info("===generateHashCodes started ===");

    const genarateHashesInstance = Container.get(GenerateHashes);
    const aviatorXProvablyInstance = Container.get(aviatorXProvablyService);

    if (gameCode === GameCode.CRASH) {
      // Remove all existing documents from the collection
      await this.crashHashModel.deleteMany({});
      console.log("All documents deleted from the collection");
    } else if (gameCode === GameCode.SLIDE) {
      await this.slideHashModel.deleteMany({});
      console.log("All documents deleted from the collection");
    } else if (gameCode === GameCode.AVIATORX) {
      await this.aviatorXServerModel.deleteMany({});
      console.log("All documents deleted from the collection");
    }

    // generate and update the hashes in the chunks of 100,000
    const chunkSize = 100000;
    const totalHashes = 100000; //TODO: change this to 3million
    let hashesLeft = totalHashes; //temp variable to keep track of number of hashes left to generate
    let tempHash = initialHash; //temp variable to keep track of the last hash generated
    while (
      hashesLeft > 0 &&
      [GameCode.CRASH, GameCode.SLIDE].includes(gameCode)
    ) {
      const hashes = await genarateHashesInstance.generateHashes(
        tempHash,
        chunkSize
      );
      // first create documents for all the hashes
      const hashesDocuments = hashes.map((hash, index) => {
        return {
          hash,
          isUsed: false,
          order: totalHashes - hashesLeft + index + 1,
        };
      });
      // reverse the hashes array
      hashesDocuments.reverse();
      // insert all the hashes into the database
      if (gameCode === GameCode.CRASH) {
        await this.crashHashModel.insertMany(hashesDocuments);
      } else if (gameCode === GameCode.SLIDE) {
        await this.slideHashModel.insertMany(hashesDocuments);
      }
      // update the tempHash
      tempHash = hashes[chunkSize - 1];
      // update the hashesLeft
      hashesLeft -= chunkSize;
      console.log(`number of hashes left to generate: ${hashesLeft}`);
    }

    // insert the initial hash in the database
    if (gameCode === GameCode.CRASH) {
      await this.crashHashModel.create({
        hash: initialHash,
        isUsed: false,
        order: 0,
      });
    } else if (gameCode === GameCode.SLIDE) {
      await this.slideHashModel.create({
        hash: initialHash,
        isUsed: false,
        order: 0,
      });
    } else if (gameCode === GameCode.AVIATORX) {
      await this.aviatorXServerModel.create(
        aviatorXProvablyInstance.generateSeedsAndHashes(
          initialHash,
          totalHashes
        )
      );
    }
    this.logger.info("===generateHashCodes ended===");
  }

  public async createNewUser(data: addOrUpdateUserInterface) {
    this.logger.info(
      "===createNewUser started for player id %s===",
      data.userId
    );
    //TODO: crypto service to genrate server seeds
    const { serverSeed, hashedServerSeed } =
      Container.get(UserSeeds).generateNewServerSeed();
    const {
      serverSeed: nextServerSeed,
      hashedServerSeed: hashedNextServerSeed,
    } = Container.get(UserSeeds).generateNewServerSeed();

    const newUser = {
      userId: data.userId,
      clientSeed: data.clientSeed,
      serverSeed,
      hashedServerSeed,
      nextServerSeed,
      hashedNextServerSeed,
      nonce: 0,
      seedHistory: {},
      platformId: data?.platformId,
      operatorId: data?.operatorId,
      brandId: data?.brandId,
      avtar: data?.avtar,
    };

    await this.userModel.create({ ...newUser });

    this.logger.info("===createNewUser ended%s===");
    return { clientSeed: data.clientSeed, hashedServerSeed, nonce: 0 };
  }

  public async updateClientSeed(data: addOrUpdateUserInterface) {
    this.logger.info(
      "===updateClientSeed started for player id %s===",
      data.userId
    );
    let user = await this.userModel.findOne({ userId: data.userId }).lean();
    //TODO: crypto service to genrate server seed and nextServerSeed
    const {
      serverSeed: nextServerSeed,
      hashedServerSeed: hashedNextServerSeed,
    } = Container.get(UserSeeds).generateNewServerSeed();

    let updateUser = {
      ...user,
      clientSeed: data.clientSeed,
      serverSeed: user.nextServerSeed,
      hashedServerSeed: user.hashedNextServerSeed,
      nextServerSeed,
      hashedNextServerSeed,
      nonce: 0,
      seedHistory: {
        ...user.seedHistory,
        [user.hashedServerSeed]: {
          clientSeed: user.clientSeed,
          serverSeed: user.serverSeed,
          hashedServerSeed: user.hashedServerSeed,
          nonce: user.nonce,
        },
      },
    };

    await this.userModel.updateOne({ userId: user.userId }, { ...updateUser });
    this.logger.info("===updateClientSeed ended%s===");
    return {
      clientSeed: data.clientSeed,
      hashedServerSeed: user.hashedNextServerSeed,
      nonce: 0,
      hashedNextServerSeed,
    };
  }

  public async getUserSeeds(data: getUserSeedsInterface) {
    this.logger.info(
      "===getUserSeeds started for player id %s===",
      data.userId
    );
    const user = await this.userModel.findOne({ userId: data.userId }).select({
      clientSeed: 1,
      hashedServerSeed: 1,
      hashedNextServerSeed: 1,
      nonce: 1,
    });

    this.logger.info("===getUserSeeds ended%s===");
    return {
      clientSeed: user.clientSeed,
      hashedServerSeed: user.hashedServerSeed,
      hashedNextServerSeed: user.hashedNextServerSeed,
      nonce: user.nonce,
    };
  }

  /**
   * @description Checks if the provided hashedServerSeed is active or not,
   * if not then check if the hashedServerSeed is present in the seedHistory, if yes then return the serverSeed from seedHistory
   */
  public async getServerSeed(data: getServerSeedInterface) {
    this.logger.info(
      "===getServerSeed started for hash code %s===",
      data.hashedServerSeed
    );
    const isActiveSeed = await this.userModel.exists({
      hashedServerSeed: data.hashedServerSeed,
    });

    if (isActiveSeed) throw new Error(i18next.t("general.activeSeed"));
    const key = `seedHistory.${data.hashedServerSeed}`;

    const user = await this.userModel
      .findOne({
        [key]: { $exists: true },
      })
      .select({ seedHistory: 1 });

    // check if the serverSeed is not present in the seedHistory, if yes then throw error
    if (!user?.seedHistory[data.hashedServerSeed])
      throw new Error(i18next.t("general.invalidUserSeed"));

    this.logger.info("===getServerSeed ended%s===");
    return { serverSeed: user.seedHistory[data.hashedServerSeed].serverSeed };
  }

  public async verifyFairness(data: any) {
    this.logger.info("===verifyFairness started for %s ===", data?.gameCode);

    const gameOutcomesInstance = Container.get(gameOutcomes);
    const multiPlayergameOutcomesInstance = Container.get(multiplayerOutcome);
    let resp = {},
      generatedTarget;

    switch (data?.gameCode) {
      case GameCode.DICE:
        generatedTarget = await gameOutcomesInstance.generateGameOutcomes(
          data?.serverSeed || "",
          data?.clientSeed || "",
          data.nonce,
          GameCode.DICE
        );
        resp = {
          gameCode: data.gameCode,
          outcome: Math.trunc(generatedTarget[0]) / 100,
        };
        break;
      case GameCode.MINE:
        generatedTarget = await gameOutcomesInstance.generateGameOutcomes(
          data?.serverSeed || "",
          data?.clientSeed || "",
          data.nonce,
          GameCode.MINE
        );

        const initialTiles = Array.from(Array(25).keys());
        const mines = generatedTarget.map((index) => {
          const mine_index = Math.floor(index);
          const mine_location = initialTiles[mine_index];
          initialTiles.splice(index, 1);
          return mine_location;
        });

        resp = {
          gameCode: data.gameCode,
          mines: mines.slice(0, data.mineCount),
        };
        break;
      case GameCode.HILO:
        generatedTarget = await gameOutcomesInstance.generateGameOutcomes(
          data?.serverSeed || "",
          data?.clientSeed || "",
          data.nonce,
          GameCode.HILO
        );

        resp = {
          gameCode: data.gameCode,
          cardOutcome: generatedTarget.reduce((map, curr) => {
            let card = hiloMath.suitOrder[Math.floor(curr)];

            let _map = {
              index: Math.floor(curr),
              card,
              rankValue: hiloMath.rankValue[card.split("-")[0]],
            };

            return [...map, { ..._map }];
          }, []),
        };
        break;
      case GameCode.LIMBO:
        generatedTarget = await gameOutcomesInstance.generateGameOutcomes(
          data?.serverSeed || "",
          data?.clientSeed || "",
          data.nonce,
          GameCode.LIMBO
        );
        resp = {
          gameCode: data.gameCode,
          outcome: generatedTarget[0],
        };
        break;
      case GameCode.DIAMOND:
        generatedTarget = await gameOutcomesInstance.generateGameOutcomes(
          data?.serverSeed || "",
          data?.clientSeed || "",
          data.nonce,
          GameCode.DIAMOND
        );
        resp = {
          gameCode: data.gameCode,
          result: generatedTarget.reduce((map, curr) => {
            return [...map, diamondMath.colorMap[Math.trunc(curr)]];
          }, []),
        };
        break;
      case GameCode.PLINKO:
        generatedTarget = await gameOutcomesInstance.generateGameOutcomes(
          data?.serverSeed || "",
          data?.clientSeed || "",
          data.nonce,
          GameCode.PLINKO
        );
        const path = generatedTarget
          .map((el) => (!!Math.trunc(el) ? "R" : "L"))
          .slice(0, data.rows);
        const payInfo = plinkoMath[data.gameMode].gameLevel[
          data.risk.toLowerCase()
        ].find((el) => el.row === data.rows).multiplierMap[
          path.filter((el) => el === "R").length
        ];

        resp = {
          gameCode: data.gameCode,
          state: {
            path,
            rows: data.rows,
            risk: data.risk,
          },
          multiplier: payInfo.multiplier,
        };
        break;
      case GameCode.CRASH:
        const result =
          await multiPlayergameOutcomesInstance.generateGameOutcomes(
            data.hash,
            data.seed,
            GameCode.CRASH
          );

        resp = {
          gameCode: data.gameCode,
          crashAt: result[data.gameMode],
        };
        break;
      case GameCode.SLIDE:
        const slideResult =
          await multiPlayergameOutcomesInstance.generateGameOutcomes(
            data.hash,
            data.seed,
            GameCode.SLIDE
          );

        resp = {
          gameCode: data.gameCode,
          multiplier: slideResult[data.gameMode],
        };
        break;
      default:
        return null;
    }

    this.logger.info("===verifyFairness ended===");
    return resp;
  }
}
