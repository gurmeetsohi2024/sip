const { type } = require('express/lib/response');
const mongoose = require('mongoose');

const adminPortfolio= new mongoose.Schema({
    name:{
        type:String,
        unique:true,
        required:true
         },
    bid:Number,
    amount:Number,
    date:{
        type:Date,
        default:Date.now
         },
    transactions:{
        price:Number,
        quantity:Number,
        date:Date,
        tType:String,
    },
   
});

const AdminPortfolio= mongoose.model('AdminPortfolio',adminPortfolio);
module.exports=AdminPortfolio;