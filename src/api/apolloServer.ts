import { ApolloServer } from "apollo-server-express";
import { Application } from "express";
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolver";

export const apolloServer = async (app: Application) => {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers
  });

  await apolloServer.start()
  apolloServer.applyMiddleware({
    app,
  });

  return apolloServer.graphqlPath
};
