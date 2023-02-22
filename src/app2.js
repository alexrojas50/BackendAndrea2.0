import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import {typeDefs} from './graphql/schema'
import {resolvers} from './graphql/resolver'

import { createServer } from 'http';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

import dbConnect from './mongo/mongo'
import User from './models/user'
import Chat from './models/Chats'

// Required logic for integrating with Express
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer }),
    {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ]
});
// Ensure we wait for our server to start
server.start().then(() => {
    dbConnect()
    // Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
    '/',
    cors(),
    bodyParser.json(),
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    }),
  );
  
  // Modified server startup
  httpServer.listen({ port: 4000 })
  
  console.log(`🚀 Server ready at http://localhost:4000/`);
})

const schema = makeExecutableSchema({ typeDefs, resolvers });
// ...

const wsServer = new WebSocketServer({
    // This is the `httpServer` we created in a previous step.
    server: httpServer,
    // Pass a different path here if app.use
    // serves expressMiddleware at a different path
    path: '/graphql',
  });
  
  // Hand in the schema we just created and have the
  // WebSocketServer start listening.
  const serverCleanup = useServer({ schema }, wsServer);

