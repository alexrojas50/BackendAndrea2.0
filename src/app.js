import express from 'express'
import { ApolloServer } from 'apollo-server-express/dist/ApolloServer'

import {typeDefs} from './graphql/schema'
import {resolvers} from './graphql/resolver'
import dbConnect from './mongo/mongo'
import User from './models/user'
import Chat from './models/Chats'

import { createServer } from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

const app = express()

async function start() {

  const apolloServer = new ApolloServer({
    typeDefs: typeDefs,
    resolvers: resolvers,
  })
  
  await apolloServer.start()
  apolloServer.applyMiddleware({app:app})
  app.listen(process.env.PORT || 5000, function(err){
    if (err) console.log("Error in server setup")
    console.log("Server listening on Port", 5000);
  })
}

start()
dbConnect()
// const data = {
//     userName: "Ale",
//     userEmail: "alexrojas",
//     userPassword: "123456"
// }

const data2 = {
  usersID: ["6362e7400c22349e4f26ae46", "6362dae876f38bea2e562d01", "6362db028104e157eb79b943"],
  messages: {
    userID: "6362dae876f38bea2e562d02",
    message: "Este será el primer mensaje",
    date: Date.now()
  },
  group: {
    isGroup: true,
    groupName: "Los 3 pendejos"
  }
}


const mesaje = {
    userName: "Ale",
    userID: "6362e7400c22349e4f26ae46",
    message: "Este será el segundo mensaje",
    date: Date.now()
  }

  const changeStream = Chat.watch()

  changeStream.on("change", next => {
    // process any change event
    console.log("received a change to the collection: \t", next);
  });



  

// // User.create(data).then((data) => {
// //   console.log("por finnnnn", data)
// // })

  // Chat.create(data2).then((data) => {
  //   console.log("CHATSSS", data)
  // })

  





Chat.updateOne({ "usersID" : ["6362e7400c22349e4f26ae46", "6362dae876f38bea2e562d01", "6362db028104e157eb79b943" ] },{ $push: { "messages" : mesaje }}).then((data) => {
  console.log("actuandooo", data)
})

console.log("Se ha inserdato")
