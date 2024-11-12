const mongoose = require('mongoose');

const adminRegistration= new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    date:{type:Date,default:Date.now},
    role:{type:String,default:"admin"},
});

const adminRegistrationExport= mongoose.model('adminRegistrationExport',adminRegistration);
module.exports=adminRegistrationExport;