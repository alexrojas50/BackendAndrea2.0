import User from "../models/user"
import Chat from "../models/Chats"
import Joi from "joi"
import { bcryptHash, bcryptCompare } from "../utils/bcrypt"
import { jwtGenerator, jwtVerify } from "../utils/jwt"
import { PubSub, withFilter  } from 'graphql-subscriptions';
import fs from 'fs'


const pubsub = new PubSub();


const resolvers = {

    Query: {
        hola: async () =>{
            try {
                return "HOLA MUNDOOOO"
            } catch (error) {
                console.log("Ocurrió un error obteniendo a los usuarios")
                return error
            }
        },
        getAllUsers: async () => {
            try {
                const users = await User.find({},{userName:1, id:1, status:1, img:1})
                return users
            } catch (error) {
                console.log("Ocurrió un error obteniendo a los usuarios")
                return error
            }
            
        },
        getUsers: async (_, data) => {
            try {
                return await User.find({'_id': { $in: data.id}})
            } catch (error) {
                console.log("Ocurrió un error obteniendo a los usuarios")
                return error
            }
        },
        getMessage: async (_, data) => {
            try {
                const chat = await Chat.findOne({'_id': data.id},{messages: 1})
                console.log(chat)
                return chat.messages
            } catch (error) {
                console.log("Ocurrió un error obteniendo los mensajes del chat")
                return error
            }
        },
        getChats: async (_, data) => {
            try {
                let chatsReturn = []
                const chatsFound = await Chat.find({ 'usersID': { $all: [data.id] } }, { usersID: 1, _id: 1, group: 1 } )
                for (const chat of chatsFound) {
                    let chatPush = { chatName: []}
                    if(chat.group.isGroup) {
                        chatPush.chatName = chat.group.groupName
                        chatPush.isGroup = chat.group.isGroup
                    }  
                    else {
                        let usersName = await User.find({'_id': { $in: chat.usersID}}, { userName: 1})
                        usersName[0].id == data.id? chatPush.chatName = usersName[1].userName : chatPush.chatName = usersName[0].userName
                    }
                    chatPush.chatId = chat.id
                    chatPush.usersId = chat.usersID
                    chatsReturn.push(chatPush)
                }
                return chatsReturn
            } catch (error) {
                console.log("Ocurrió un error obteniendo a los usuarios")
                return error
            }
        },
        login: async (_, data) => {
            try {
                const registerSchema = Joi.object({
                    userName: Joi.string().min(3).max(30).required(),
                    userPassword: Joi.string().min(6).max(30).required(),
                })
                const validations = registerSchema.validate({ userName: data.userInfo.userName, userPassword: data.userInfo.userPassword })
                if(validations.error) throw validations.error.details[0].message
                const user = await User.findOne({'userName': data.userInfo.userName})
                console.log(user)
                if(!user) throw "Este usuario no existe"
                if (!await bcryptCompare(data.userInfo.userPassword, user.userPassword)) throw "Pon la contraseña bien o te bloqueo del sistema >:("
                const token = await jwtGenerator({userName: user.userName, userId: user._id})
                await jwtVerify(token)
                user.status = true
                user.save()
                return {
                    token: token,
                    userName: data.userInfo.userName,
                    userID: user.id
                }
                
            } catch (error) {
                return {error : error}
            }
        },
        verifyToken : async (_, data) => {
            try {
                await jwtVerify(data.token)
                return true
            } catch (error) {
                return false
            }
        },
    },

    Mutation: {
        register: async(_, data) => {
            try {
                if(data.userInfo.userName.toLowerCase() == "jeremy" || data.userInfo.userName.toLowerCase() == "croissant") data.userInfo.userName = "Mariquito"
                const registerSchema = Joi.object({
                    userName: Joi.string().min(3).max(30).required(),
                    userPassword: Joi.string().min(6).max(30).required(),
                })
                const validations = registerSchema.validate({ userName: data.userInfo.userName, userPassword: data.userInfo.userPassword })
                if(validations.error) throw validations.error.details[0].message
                const passwordHashed = await bcryptHash(data.userInfo.userPassword)
                const users = await User.find({'userName': data.userInfo.userName})
                if(users.length > 0) throw "Este nombre de usuario ya está en uso"
                var imageAsBase64 = fs.readFileSync(require.resolve("./cerezas.jpg"), 'base64')
                return User.create({ userName: data.userInfo.userName, userPassword: passwordHashed, img: { data: imageAsBase64 }}).then(() =>{
                    return {status: true}
                })
            } catch (error) {
                console.log("Ocurrió un error creando al usuario")
                return {error : error, status: false}
            }
        },
        insertMessage: async(_, data) => {
            try {
                const chat = await Chat.findOne({id: data.data.chatId},{group:1, usersID:1})
                if(!chat) throw "No existe este chat"
                const user = await User.findOne({id: data.data.userId})
                if(!user) throw "Este usuario no existe"
                const IDs = []
                chat.usersID.forEach(id => {
                    IDs.push(id.toString())
                });
                if(!IDs.includes(data.data.userId)) throw "No perteneces a este chat"
                const mesaje = {
                    userID: data.data.userId,
                    userName: data.data.userName,
                    message: data.data.message,
                    date: data.data.date
                }
                const message = Chat.updateOne({ id : data.chatId },{ $push: { "messages" : mesaje }})
                if(message.modifiedCount == 0) throw "Ah ocurrido un error al envíar el mensaje"
                pubsub.publish('POST_CREATED', { 
                    message: mesaje,
                    groupName:chat.group.groupName,
                    isgroup:chat.group.isGroup,
                    usersID:chat.usersID
                }
                );
                return {success:true}
            } catch (error) {
                console.log("Ocurrió un error Enviando un mensaje", error)
                return {error : error, success: false}
            }
        },
        changeStatus: async(_, data) => {
            try {
                const userFind = await User.findById(data.id,{status:1})
                if(!userFind) throw "Este usuario no existe"
                userFind.status = false
                userFind.save()
                return {error: false, success:true}
            } catch (error) {
                return {error: error, success:false}
            }
        },
    },
    
    Subscription: {
        messageAdded: {
          subscribe: withFilter(
            () => pubsub.asyncIterator('POST_CREATED'),
            (payload, variables) => {
                console.log("AVERR")
                const IDs = []
                payload.messageAdded.usersID.forEach(id => {
                    IDs.push(id.toString())
                });
              return (
                    IDs.includes(variables.id)
                );
            },
          ),
        },
        messageAdded2: {
            subscribe:(data) => {
                console.log("XDDD", data)
                return pubsub.asyncIterator('COMMENT_ADDED')}
        }
      }
}

//console.log(await bcryptCompare(data.userInfo.userPassword, passwordHashed))


module.exports = {resolvers}