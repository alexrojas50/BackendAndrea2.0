import { gql } from 'apollo-server-express'


const typeDefs = gql`

scalar Date
scalar Buffer

type data {
    data: Buffer
}


type dataUsers {
    id: ID
    userName: String
    status: Boolean
    img: data
}

type dataChats {
    chatId: ID
    usersId: [ID]
    chatName: String
    isGroup: Boolean
}

type messages {
    userName: String
    userID: ID
    message: String
    date: Date
}

type messagesSubscription {
    message: messages
    isgroup: Boolean
    groupName: String
    usersID: [ID]
}

type registerReturn {
    error: String
    status: Boolean
}

type loginReturn {
    error: String
    token: String
    userName: String
    userID: String
}

type messageReturn {
    success: Boolean
    error: String
}

type returnStatus {
    success: Boolean
    error: String
}

input register {
    userName: String
    userPassword: String
}

input login {
    userName: String
    userPassword: String
}

input insertMessage {
    chatId: String
    userName: String
    userId: String
    message: String
    date: Date
}

type Query {
    getAllUsers: [dataUsers]
    getUsers(id: [ID]): [dataUsers]
    getMessage(id: ID): [messages]
    getChats(id:ID): [dataChats]
    login(userInfo: login): loginReturn
    hola: String
    verifyToken(token : String) : Boolean
}

type Mutation {
    register(userInfo: register): registerReturn
    insertMessage(data: insertMessage): messageReturn
    changeStatus(id: ID): returnStatus
}

type Subscription {
    messageAdded(id: ID): messagesSubscription
    messageAdded2: String

}
`

module.exports = {typeDefs}