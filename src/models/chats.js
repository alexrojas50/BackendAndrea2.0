import {Schema, model} from 'mongoose'

const parChat = new Schema({
    userID: {
        type: Schema.Types.ObjectId,
    },
    messages: [{ userID: Schema.Types.ObjectId, message: String, date: Date }]
})

const Chats = new Schema({
    usersID: [Schema.Types.ObjectId],
    messages: [{ userID: Schema.Types.ObjectId, message: String, date: Date, userName: String }],
    group: {
        isGroup: {
            type: Boolean, 
            required: true
        }, 
        groupName: String
    }
})



const Chat = model("Chats", Chats)

export default Chat
