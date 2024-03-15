import expressLoader from "./express";
import dependencyInjectorLoader from "./dependencyInjector";
import mongooseLoader from "./mongoose";
import Logger from "./logger";
import { crashInit, slideInit } from "./mulyiplayerGameInit";
import SocketServer from "./socket";
import rgsSocketInit from "./rgsSocketListener";
import cacheInit from "./cache";
//We have to import at least all the events once so they can be triggered
import "./events";

export default async ({ expressApp, httpServer }) => {
  await mongooseLoader();
  Logger.info("✌️ DB loaded and connected!");

  const gameSeeds = {
    name: "gameSeeds",
    model: require("../models/gameSeedsModel").default,
  };

  const userModel = {
    name: "userModel",
    model: require("../models/userModel").default,
  };

  const gameModel = {
    name: "gameModel",
    model: require("../models/gameModel").default,
  };

  const crashHashModel = {
    name: "crashHashModel",
    model: require("../models/crashHashModel").default,
  };

  const crashGameModel = {
    name: "crashGames",
    model: require("../models/crashGameModel").default,
  };

  const slideHashModel = {
    name: "slideHashModel",
    model: require("../models/slideHashModel").default,
  };

  const slideGameModel = {
    name: "slideGames",
    model: require("../models/slideGameModel").default,
  };

  const { io } = await SocketServer(httpServer, Logger);
  const { myCache } = await cacheInit(Logger);
  Logger.info("✌️ SocketServer listening");

  await dependencyInjectorLoader({
    models: [
      gameSeeds,
      userModel,
      gameModel,
      crashHashModel,
      crashGameModel,
      slideHashModel,
      slideGameModel
    ],
    io,
    myCache,
  });

  Logger.info("✌️ Dependency Injector loaded");

  crashInit();
  slideInit();
  await expressLoader({ app: expressApp });
  Logger.info("✌️ Express loaded");
  await rgsSocketInit(io, Logger);
};
