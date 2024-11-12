const mongoose = require('mongoose');

const cashHoldingSchema= new mongoose.Schema({
  cash:Number,
   
});

const cashHolding= mongoose.model('cashHolding',cashHoldingSchema);
module.exports=cashHolding;