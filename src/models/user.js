import {Schema, model} from 'mongoose'

const Users = new Schema({
    userName: {
        type: String,
    },
    userPassword: {
        type: String,
    },
    status: {
        type: Boolean,
        default: false
    },
    img:
    {
        data: Buffer,
        contentType: String
    }
})

const User = model("Users", Users)

export default User
