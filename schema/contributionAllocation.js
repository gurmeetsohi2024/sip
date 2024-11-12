const mongoose = require('mongoose');

const contributionAllocation= new mongoose.Schema({
    sip:Number,
    cash:Number,
    equity:Number,
    date:{type:Date,default:Date.now},
    
});

const ca= mongoose.model('ca',contributionAllocation);
module.exports=ca;