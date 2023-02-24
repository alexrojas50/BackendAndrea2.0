import { gql } from 'apollo-server-express'


const typeDefs = gql`

scalar Date
scalar Buffer
scalar Upload

type data {
    data: Buffer
    contentType: String
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

type returnMessages {
    success: Boolean
    error: String
    messages: [messages]
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

type statusSubs {
    userId: String
    status: Boolean
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

input insertMessageFriend {
    friendId: String
    userName: String
    userId: String
    message: String
    date: Date
}

input changeImgInput {
    userId: ID
    base64: Upload
}

input getMessagesInput{
    userId: String
    friendId: String
    isGroup: Boolean
    chatId: String
}

type Query {
    getAllUsers: [dataUsers]
    getUsers(id: [ID]): [dataUsers]
    getMessage(data: getMessagesInput): returnMessages
    getChats(id:ID): [dataChats]
    login(userInfo: login): loginReturn
    hola: String
    verifyToken(token : String) : Boolean
}

type Mutation {
    register(userInfo: register): registerReturn
    insertMessageGruop(data: insertMessage): messageReturn
    insertMessageFriend(data: insertMessageFriend): messageReturn
    Croissant(userId: ID): messageReturn
    changeStatus(id: ID): returnStatus
    changeImgUser(data: changeImgInput): registerReturn
}

type Subscription {
    messageAdded(id: ID): messagesSubscription
    statusUser: statusSubs

}
`

module.exports = {typeDefs}