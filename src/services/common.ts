import { customAlphabet } from "nanoid/async";
import { performance, PerformanceObserver } from "perf_hooks";
import { Container } from "typedi";

import { Logger } from "winston";
let observer = null;

export default class CommonService {
  initiatePerformanceLogger() {
    if (!observer) {
      const logger: Logger = Container.get("logger");
      observer = new PerformanceObserver((list, obs) => {
        const lists = list
          .getEntries()
          .forEach((entry) =>
            logger.info(
              `${entry.name} took ${entry.duration.toFixed(2)}ms / ${(
                entry.duration / 1000
              ).toFixed(2)}s to complete`
            )
          );
        return lists;
      });
      observer.observe({ buffered: true, entryTypes: ["measure"] });
    }
  }

  startPerformanceLogging() {
    performance.mark("start");
  }

  endPerformanceLogging(apiName: string) {
    performance.mark("stop");
    performance.measure(apiName, "start", "stop");
  }

  escapeStringRegexp = (str: string) =>
    str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");

  generateRandomNumber = async (length = 4) => {
    const nanoid = customAlphabet("123456789", length);
    return Number(await nanoid());
  };

  generateRandomCode = async (length = 6) => {
    const nanoid = customAlphabet(
      "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789",
      length
    );
    return nanoid();
  };

  timer = (ms) => new Promise((res) => setTimeout(res, ms));
}
