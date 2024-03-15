import { Container } from 'typedi';
import { Server } from 'socket.io';
import NodeCache from 'node-cache';
import LoggerInstance from './logger';

export default async ({ models, io, myCache }: { models: { name: string; model: any }[], io: Server; myCache: NodeCache}): Promise<any> => {
  try {
    models.forEach((m) => {
      Container.set(m.name, m.model);
    });

    Container.set('io', io);
    Container.set('cache', myCache);
    Container.set('logger', LoggerInstance);
  } catch (e) {
    LoggerInstance.error('🔥 Error on dependency injector loader: %o', e);
    throw e;
  }
};
