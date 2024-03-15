import 'reflect-metadata'; // We need this in order to use @Decorators
import config from './config';
import express from 'express';
import http from 'http';
import Logger from './loaders/logger';

async function startServer() {
  const app = express();
  const httpServer = new http.Server(app);

  /**
   * A little hack here
   * Import/Export can only be used in 'top-level code'
   * Well, at least in node 10 without babel and at the time of writing
   * So we are using good old require.
   **/
  await require('./loaders').default({ expressApp: app, httpServer });

  httpServer
    .listen(`${config.port}`, () => {
      Logger.info(`
      ################################################
      🛡️  ${process.env.NODE_ENV} Server listening on port: ${config.port}/graphql 🛡️
      ################################################
    `);
    })
    .on('error', (err) => {
      Logger.error(err);
      process.exit(1);
    });
}

startServer();
