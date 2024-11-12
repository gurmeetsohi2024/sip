
const mongoose = require('mongoose');

const userRegistration= new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    income:Number,
    whatsapp:String,
    token:String,
    date:{type:Date,default:Date.now},
    role:String,
});

const Registration= mongoose.model('Registration',userRegistration);
module.exports=Registration;