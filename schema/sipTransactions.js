const mongoose = require('mongoose');

const sipTransactions= new mongoose.Schema({
    id:String,
    Sname:String,
    StartingPrice:Number,
    status:String,
    sipAmount:Number,
    topupAmount:Number,
    quantity:Number,
    catagory:String,
    date:Date,
    sipStartingDate:Date,
    sharePrice:Number,
    transactionCatagory:String,
    cashOutAmount:Number,
    cashOutPrice:Number,
    cashOutDate:Date,
    sector:String,
    region:String,
    transType:{ type: String, default: 'buy' },
   
});

const sipT= mongoose.model('sipT',sipTransactions);
module.exports=sipT;