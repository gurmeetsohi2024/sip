const lumpsumSchema= new mongoose.Schema({
    id:String,
    Sname:String,
    StartingPrice:Number,
    status:String,
    sipAmount:Number,
    quantity:Number,
    catagory:String,
    date:Date.now(),
    transType:{ type: String, default: 'buy' },
   
});

const sipLumpsum= mongoose.model('sipLumpsum',lumpsumSchema);
module.exports=sipT;