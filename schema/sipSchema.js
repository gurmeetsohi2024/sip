const mongoose = require('mongoose');

const sipSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
         },
    status:String,
    details:String,
    date:{
        type:Date,
        default:Date.now
         },
    security:{
        Sname:String,
    },
    transactions:{
        id:String,
        Sname:String,
        StartingPrice:Number,
        status:String,
        sipAmount:Number,
        quantity:Number,
        date:Date,
        transType:{ type: String, default: 'buy' },
    },
   
});

const sip= mongoose.model('sip',sipSchema);
module.exports=sip;