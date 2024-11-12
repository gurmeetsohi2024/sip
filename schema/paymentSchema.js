const mongoose = require('mongoose');

const paymentSchema= new mongoose.Schema({
    name:String,
    email:String,
    price:Number,
    paymentStatus:String,
    currency:String,
    totalAmount:Number,
    product:String,
    paymentMethod:Array,
    transactionDate:Date,
    transactionId:String,
    date:{type:Date,default:Date.now},
    exp_date:Date,
    
});

const payment= mongoose.model('payment',paymentSchema);
module.exports=payment;