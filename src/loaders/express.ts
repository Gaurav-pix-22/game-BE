import express from 'express';
import cors from 'cors';
import {apolloServer} from "../api/apolloServer"
import cookieParser from 'cookie-parser';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import i18nextMiddleware from 'i18next-http-middleware';
import path from 'path';
import { StatusCodes } from 'http-status-codes';
import { isCelebrateError } from 'celebrate';
import LoggerInstance from './logger';

export default async ({ app }: { app: express.Application }): Promise<any> => {
  /**
   * Health Check endpoints
   * @TODO Explain why they are here
   */
  app.get('/status', (req, res) => {
    res.status(StatusCodes.OK).end();
  });

  console.log(__dirname)

  i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
      backend: {
        loadPath: path.join(__dirname, '/resources/locales/{{lng}}/{{ns}}.json'),
      },
      fallbackLng: 'en',
      preload: ['en'],
    });
  app.use(i18nextMiddleware.handle(i18next));

  app.set('view engine', 'ejs');

  // Useful if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
  // It shows the real origin IP in the heroku or Cloudwatch logs
  app.enable('trust proxy');

  // The magic package that prevents frontend developers going nuts
  // Alternate description:
  // Enable Cross Origin Resource Sharing to all origins by default
  app.use(cors());

  // Some sauce that always add since 2014
  // "Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it."
  // Maybe not needed anymore ?
  app.use(require('method-override')());

  // Middleware that transforms the raw string of req.body into json
  app.use(express.json({ limit: '50mb' }));
  app.use(
    express.urlencoded({
      extended: true,
    }),
  );
  app.use(cookieParser());

  // Load API routes
  // use this for local testing
  //  app.use(config.api.prefix, routes());

  //  Use these while deployment
  // app.use(routes());
  // GraphQL API
  await apolloServer(app);

  // / catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err['status'] = StatusCodes.NOT_FOUND;
    next(err);
  });

  //err handler
  app.use((err, req, res, next) => {
    console.log("err",err);
    
    if (isCelebrateError(err)) {
      let message = '';
      for (const value of err.details.values()) {
        message += value.message + '; ';
      }
      LoggerInstance.error('JOI Validating API: %s, error: %s, body: %o', req.originalUrl, message, req.body);
      return res.status(StatusCodes.BAD_REQUEST).json({ message });
    }

    res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR);
    const json: any = {
      message: err.message,
    };
    if (err.data) {
      json.data = err.data;
    }
    res.json(json);
  });
};
