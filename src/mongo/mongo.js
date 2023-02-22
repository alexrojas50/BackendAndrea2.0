const mongoose = require("mongoose"); // Crea conexión entre MongoDB y el marco de la aplicación web Express
const User = require('../models/user')

const dbConnect = () => {
    console.log("Conectando a MongoDB")
    mongoose.connect("mongodb+srv://alejandro:alejandro1@crudalejandro.7tzyv.mongodb.net/crudAlejandro?retryWrites=true&w=majority", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },(err, res) => {
        if(!err){
            console.log('**** CONEXION CORRECTA ****')
        }else{
            console.log('**** ERROR DE CONEXION ****')
        }
    });
}; 

module.exports = dbConnect