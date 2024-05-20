import Container from "typedi";
import Logger from "./logger";
import crashService from "../services/crashService";
import aviatorXService from "../services/aviatorXService"
import slideService from "../services/slideService";

const crashInit = async () => {
  try {
    Logger.info("✌️ crashInit begins");
    let proceedNext = true;
    let message = "";

    while (proceedNext) {
      const crashServiceInstance = Container.get(crashService);
      let result = await crashServiceInstance.createGame();
      proceedNext = result.proceedNext;
      message = result.message;
    }

    Logger.error(`crashInit terminated: ${message}`);
  } catch (e) {
    console.log(e)
    Logger.error(`crashInit stopped by err: ${e?.message}`);
  }
};

const aviatorXInit = async () => {
  try {
    Logger.info("✌️ aviatorXInit begins");
    let proceedNext = true;
    let message = "";

    while (proceedNext) {
      const crashServiceInstance = Container.get(aviatorXService);
      let result = await crashServiceInstance.createGame();
      proceedNext = result.proceedNext;
      message = result.message;
    }

    Logger.error(`aviatorXInit terminated: ${message}`);
  } catch (e) {
    console.log(e)
    Logger.error(`aviatorXInit stopped by err: ${e?.message}`);
  }
};

const slideInit = async () => {
  try {
    Logger.info("✌️ slideInit begins");
    let proceedNext = true;
    let message = "";

    while (proceedNext) {
      const slideServiceInstance = Container.get(slideService);
      let result = await slideServiceInstance.createGame();
      proceedNext = result.proceedNext;
      message = result.message;
    }
  } catch (e) {
    Logger.error(`slideInit stopped: ${e?.message}`);
  }
};

export { crashInit, slideInit, aviatorXInit };
