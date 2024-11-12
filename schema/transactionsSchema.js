const mongoose = require('mongoose');

const packagesSchema= new mongoose.Schema({
    name:String,
    highlight:String,
    details:String,
    price:Number,
    date:{type:Date,default:Date.now},
    
});

const OfferPackages= mongoose.model('OfferPackages',packagesSchema);
module.exports=OfferPackages;