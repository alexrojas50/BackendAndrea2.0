import User from "../models/user"
import Chat from "../models/Chats"
import Joi from "joi"
import { bcryptHash, bcryptCompare } from "../utils/bcrypt"
import { jwtGenerator, jwtVerify } from "../utils/jwt"
import { PubSub, withFilter } from 'graphql-subscriptions';
import fs from 'fs'
import { resolve } from 'path'
import mongoose from "mongoose"


const pubsub = new PubSub();


const resolvers = {

    Query: {
        hola: async () => {
            try {
                return "HOLA MUNDOOOO"
            } catch (error) {
                console.log("Ocurrió un error obteniendo a los usuarios")
                return error
            }
        },
        getAllUsers: async () => {
            try {
                const users = await User.find({}, { userName: 1, id: 1, status: 1, img: 1 })
                console.log("RETORNANDO USARIOS")
                return users
            } catch (error) {
                console.log("Ocurrió un error obteniendo a los usuarios")
                return error
            }

        },
        getUsers: async (_, data) => {
            try {
                return await User.find({ '_id': { $in: data.id } })
            } catch (error) {
                console.log("Ocurrió un error obteniendo a los usuarios")
                return error
            }
        },
        getMessage: async (_, data) => {
            try {
                if (!data.data.userId) throw "Identifícate"
                if (data.data.isGroup) {
                    const chat = await Chat.findOne({ _id: data.data.chatId }, { messages: 1, usersID: 1 }).sort({ date: 1 })
                    if (!chat) throw "No existe este chat"
                    if (!chat.usersID.includes(data.data.userId)) throw "No perteneces a este chat"
                    console.log("PASANDOO33333")

                    return { error: false, success: true, messages: chat.messages }
                } else {
                    const chat = await Chat.findOne(
                        { usersID: { $all: [mongoose.Types.ObjectId(data.data.userId), mongoose.Types.ObjectId(data.data.friendId)] }, group: { isGroup: false } },
                        { _id: 1, usersID: 1, messages: 1 })
                    console.log(chat)
                    if (!chat) throw "No existe este chat"
                    if (!chat.usersID.includes(data.data.userId)) throw "No perteneces a este chat"
                    return { error: false, success: true, messages: chat.messages }
                }

            } catch (error) {
                console.log("Ocurrió un error obteniendo los mensajes del chat")
                console.log(error)
                return { error: error, success: false }
            }
        },
        getChats: async (_, data) => {
            try {
                let chatsReturn = []
                const chatsFound = await Chat.find({ 'usersID': { $all: [data.id] } }, { usersID: 1, _id: 1, group: 1 })
                for (const chat of chatsFound) {
                    let chatPush = { chatName: [] }
                    if (chat.group.isGroup) {
                        chatPush.chatName = chat.group.groupName
                        chatPush.isGroup = chat.group.isGroup
                    }
                    else {
                        let usersName = await User.find({ '_id': { $in: chat.usersID } }, { userName: 1 })
                        usersName[0].id == data.id ? chatPush.chatName = usersName[1].userName : chatPush.chatName = usersName[0].userName
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
                if (data.userInfo.userName.toLowerCase() == "jeremy" || data.userInfo.userName.toLowerCase() == "croissant" || data.userInfo.userName.toLowerCase() == "quaso") data.userInfo.userName = "Mariquito"
                const registerSchema = Joi.object({
                    userName: Joi.string().min(3).max(30).required(),
                    userPassword: Joi.string().min(6).max(30).required(),
                })
                const validations = registerSchema.validate({ userName: data.userInfo.userName, userPassword: data.userInfo.userPassword })
                if (validations.error) throw validations.error.details[0].message
                const user = await User.findOne({ 'userName': data.userInfo.userName })
                if (!user) throw "Este usuario no existe"
                if (!await bcryptCompare(data.userInfo.userPassword, user.userPassword)) throw "Pon la contraseña bien o te bloqueo del sistema >:("
                const token = await jwtGenerator({ userName: user.userName, userId: user._id })
                await jwtVerify(token)
                user.status = true
                user.save()
                console.log("AVERRRR")
                pubsub.publish('STATUS_CHANGED', {
                    statusUser: {
                        userId: user.id,
                        status: true
                    }
                });
                console.log("AVERRRR")
                return {
                    token: token,
                    userName: data.userInfo.userName,
                    userID: user.id
                }


            } catch (error) {
                return { error: error }
            }
        },
        verifyToken: async (_, data) => {
            try {
                await jwtVerify(data.token)
                return true
            } catch (error) {
                return false
            }
        },
    },

    Mutation: {
        register: async (_, data) => {
            try {
                if (data.userInfo.userName.toLowerCase() == "jeremy" || data.userInfo.userName.toLowerCase() == "croissant" || data.userInfo.userName.toLowerCase() == "quaso") data.userInfo.userName = "Mariquito"
                const registerSchema = Joi.object({
                    userName: Joi.string().min(3).max(30).required(),
                    userPassword: Joi.string().min(6).max(30).required(),
                })
                const validations = registerSchema.validate({ userName: data.userInfo.userName, userPassword: data.userInfo.userPassword })
                if (validations.error) throw validations.error.details[0].message
                const passwordHashed = await bcryptHash(data.userInfo.userPassword)
                const users = await User.find({ 'userName': data.userInfo.userName })
                if (users.length > 0) throw "Este nombre de usuario ya está en uso"
                var imageAsBase64 = "data:image/jpg;base64," + fs.readFileSync(resolve(__dirname, "../images/cerezas.jpg"), 'base64');
                var contentType = imageAsBase64.split("/")[1].split(";")[0]
                var bindata = new Buffer.from(imageAsBase64.split(",")[1], "base64");
                return User.create({ userName: data.userInfo.userName, userPassword: passwordHashed, img: { data: bindata, contentType: contentType } }).then(() => {
                    return { status: true }
                })
            } catch (error) {
                console.log("Ocurrió un error creando al usuario")
                return { error: error, status: false }
            }
        },
        insertMessageGruop: async (_, data) => {
            try {
                console.log("DATAAA", data)
                const chat = await Chat.findOne({ _id: mongoose.Types.ObjectId(data.data.chatId) }, { group: 1, usersID: 1 })
                console.log("CHATTT", chat)

                if (!chat) throw "No existe este chat"

                const user = await User.findOne({ id: mongoose.Types.ObjectId(data.data.userId) }, { _id: 1, userName: 1 })
                if (!user) throw "Este usuario no existe"
                console.log("USUARIOO", user)
                const IDs = []
                chat.usersID.forEach(id => {
                    IDs.push(id.toString())
                });
                console.log("IDSSSS", IDs, IDs.includes(data.data.userId))
                if (!IDs.includes(data.data.userId)) throw "No perteneces a este chat"
                const mesaje = {
                    userID: data.data.userId,
                    userName: data.data.userName,
                    message: data.data.message,
                    date: data.data.date
                }
                const message = await Chat.updateOne({ id: data.chatId }, { $push: { "messages": mesaje } })
                console.log("UPDATEEE", message)

                if (message.modifiedCount == 0) throw "Ah ocurrido un error al envíar el mensaje"
                console.log("USERIDDDD", chat.usersID)
                pubsub.publish('MESSAGE_ADDED', {
                    messageAdded: {
                        message: mesaje,
                        groupName: chat.group.groupName,
                        isgroup: chat.group.isGroup,
                        usersID: chat.usersID
                    }
                });
                return { success: true }
            } catch (error) {
                console.log("Ocurrió un error Enviando un mensaje", error)
                return { error: error, success: false }
            }
        },
        insertMessageFriend: async (_, data) => {
            try {
                const users = await User.find({ _id: { $in: [mongoose.Types.ObjectId(data.data.userId), mongoose.Types.ObjectId(data.data.friendId)] } }, { id: 1 })
                if (users.length !== 2) throw "Uno de los usarios no existe"
                return Chat.findOne(
                    { usersID: { $all: [mongoose.Types.ObjectId(data.data.userId), mongoose.Types.ObjectId(data.data.friendId)] }, group: { isGroup: false } },
                    { _id: 1, usersID: 1, messages: { _id: 1 }, }
                ).then((ChatFind) => {
                    if (!ChatFind) {
                        return Chat.create({
                            usersID: [data.data.userId, data.data.friendId],
                            messages: [{ userID: data.data.userId, message: data.data.message, date: data.data.date, userName: data.data.userName }],
                            group: {
                                isGroup: false
                            }
                        }).then(() => {
                            pubsub.publish('MESSAGE_ADDED', {
                                messageAdded: {
                                    message: { userID: data.data.userId, message: data.data.message, date: data.data.date, userName: data.data.userName },
                                    isgroup: false,
                                    usersID: [data.data.userId, data.data.friendId]
                                }
                            });
                            return { error: false, success: true }
                        }).catch((error) => {
                            throw error
                        })
                    } else {
                        ChatFind.messages.push({ userID: data.data.userId, message: data.data.message, date: data.data.date, userName: data.data.userName })
                        ChatFind.save()
                        pubsub.publish('MESSAGE_ADDED', {
                            messageAdded: {
                                message: { userID: data.data.userId, message: data.data.message, date: data.data.date, userName: data.data.userName },
                                isgroup: false,
                                usersID: [data.data.userId, data.data.friendId]
                            }
                        });
                        return { error: false, success: true }
                    }



                })
            } catch (error) {
                console.log("Ocurrió un error Enviando un mensaje", error)
                return { error: error, success: false }
            }
        },
        changeStatus: async (_, data) => {
            try {
                const userFind = await User.findById(data.id, { status: 1 })
                if (!userFind) throw "Este usuario no existe"
                userFind.status = false
                userFind.save()
                pubsub.publish('STATUS_CHANGED', {
                    statusUser: {
                        userId: userFind.id,
                        status: false
                    }
                });
                return { error: false, success: true }
            } catch (error) {
                return { error: error, success: false }
            }
        },
        changeImgUser: async (_, data) => {
            try {

                const userFind = await User.findById(data.data.userId, { img: 1 })
                if (!userFind) throw "Este usuario no existe"
                console.log("DATAAAA", data.data)
                var imageAsBase64 = data.data.base64
                var contentType = imageAsBase64.split("/")[1].split(";")[0]
                var bindata = new Buffer.from(imageAsBase64.split(",")[1], "base64");
                userFind.img = { data: bindata, contentType: contentType }
                userFind.save()
                return { error: false, success: true }
            } catch (error) {
                return { error: error, success: false }
            }
        },
        Croissant: async (_, data) => {
            try {
                const Jeremy = await User.findOne({ userName: "Mariquito" }, { id: 1 })
                if (!Jeremy) throw "Jeremy aún no existe :("
                if (Jeremy.id == data.userId) throw "Intentando enviarte un Croissant a tí mismo?"
                const user = await User.findOne({ id: data.userId }, { id: 1, userName: 1 })
                if (!user) throw "No existes"
                return Chat.findOne(
                    { usersID: { $all: [mongoose.Types.ObjectId(data.userId), Jeremy.id] }, group: { isGroup: false } },
                    { _id: 1, usersID: 1, messages: { _id: 1 }, }
                ).then((ChatFind) => {
                    if (!ChatFind) {
                        return Chat.create({
                            usersID: [data.userId, Jeremy.id],
                            messages: [{ userID: data.userId, message: "🥐", date: Date.now(), userName: user.userName }],
                            group: {
                                isGroup: false
                            }
                        }).then(() => {
                            pubsub.publish('MESSAGE_ADDED', {
                                messageAdded: {
                                    message: { userID: data.userId, message: "🥐", date: Date.now(), userName: user.userName },
                                    isgroup: false,
                                    usersID: [data.userId, Jeremy.id]
                                }
                            });
                            return { error: false, success: true }
                        }).catch((error) => {
                            throw error
                        })
                    } else {
                        ChatFind.messages.push({ userID: data.userId, message: "🥐", date: Date.now(), userName: user.userName })
                        ChatFind.save()
                        pubsub.publish('MESSAGE_ADDED', {
                            messageAdded: {
                                message: { userID: data.userId, message: "🥐", date: Date.now(), userName: user.userName },
                                isgroup: false,
                                usersID: [data.userId, Jeremy.id]
                            }
                        });
                        return { error: false, success: true }
                    }



                })
            } catch (error) {
                console.log("Ocurrió un error Enviando un mensaje", error)
                return { error: error, success: false }
            }
        },
    },

    Subscription: {
        messageAdded: {
            subscribe: withFilter(
                () => {
                    console.log("XDDD")
                    return pubsub.asyncIterator('MESSAGE_ADDED')
                },
                (payload, variables) => {
                    console.log("AVERR")
                    const IDs = []
                    console.log("PAYOLADDDD", payload)
                    payload.messageAdded.usersID.forEach(id => {
                        IDs.push(id.toString())
                    });
                    return (
                        IDs.includes(variables.id)
                    );
                },
            ),
        },
        statusUser: {
            subscribe: (data) => {
                console.log("XDDD", data)
                return pubsub.asyncIterator('STATUS_CHANGED')
            }
        }
    }
}

//console.log(await bcryptCompare(data.userInfo.userPassword, passwordHashed))


module.exports = { resolvers }