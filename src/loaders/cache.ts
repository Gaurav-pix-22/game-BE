import NodeCache from "node-cache";
import { Logger } from "winston";

const cacheInit = async (logger: Logger) => {
  const myCache = new NodeCache({ checkperiod: 60*2 });
  myCache.on("expired", (key, value) => {
    logger.info(`Node cache expiered for key: ${key}.`);
    console.log(key, value);
  });

  logger.info(`✌️ Node cache ready.`);

  return { myCache };
};

export default cacheInit;
