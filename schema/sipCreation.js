const mongoose = require('mongoose');

const sipCreation= new mongoose.Schema({
    id:String,
    Sname:String,
    StartingPrice:Number,
    status:String,
    sipAmount:Number,
    quantity:Number,
    catagory:String,
    date:Date,
    sipStartingDate:Date,
    sipStartingDayofMonth:Number,
    sharePrice:Number,
    sector:String,
    region:String,
    transType:{ type: String, default: 'buy' },
    
    
   
});

const sipCreate= mongoose.model('sipCreate',sipCreation);
module.exports=sipCreate;