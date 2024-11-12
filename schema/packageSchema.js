const mongoose = require('mongoose');

const packagesSchema= new mongoose.Schema({
    name:String,
    highlight:String,
    fld1:String,
    fld2:String,
    fld3:String,
    fld4:String,
    price:Number,
    date:{type:Date,default:Date.now},
    
});

const OfferPackages= mongoose.model('OfferPackages',packagesSchema);
module.exports=OfferPackages;