const express= require('express');
const app= express();
const dotenv = require('dotenv').config();
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const Chart=require('chart.js/auto');
var cron = require('node-cron');
var session = require('express-session');
var passport=require('passport');
var LocalStrategy = require('passport-local');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);



const allData= require("./api/allstocks.js");
const allDataFromApi= require("./api/allstocks.js");
const {auth}= require("./middleware/auth.js");
const {verifyRouteAdmin}= require("./middleware/adminAuth.js");
console.log({auth});
// const  Student=require("./schema/studentSchema");
const Registration = require('./schema/userRegistration.js');
const  OfferPackages=require("./schema/packageSchema.js");
const  AdminPortfolio=require("./schema/adminPortfolio.js");
const  sip=require("./schema/sipSchema.js");
const  sipCreate=require("./schema/sipCreation.js");
const  sipT=require("./schema/sipTransactions.js");
const  cashHolding=require("./schema/cashHoldingSchema.js");
const  payment=require("./schema/paymentSchema.js");
const  adminRegistrationExport=require("./schema/adminRegistration.js");
const  ca=require("./schema/contributionAllocation.js");
//expoting data for chart
const portfolioShareValue=[];


//const dirPath = path.join(__dirname, '/views');
// app.use(express.static(path.join(__dirname, 'public')));

//api result
const {allApi}=require("./api/AllApi.js");

// for authentication
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

const { name } = require('ejs');
const { status } = require('express/lib/response.js');
const { request } = require('http');
const { userInfo } = require('os');
SECRET_KEY="SECRET_key_4587";

//session variable
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie:{
    maxAge:1000*60*60*24,//24 hrs
  }
}));

app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());
app.use(passport.authenticate('session'));// for session


const { Schema } = mongoose;
const port=3000;



//passport
app.use(passport.initialize());
app.use(passport.session());


app.set("view-engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://Admin_babul:Cyber%40523%23@cluster0.7gv45kf.mongodb.net/stockpf').then(() => console.log('Connected!'));

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}


const autoMode=cron.schedule(' */15 * * * 1-5',async() => {
  // console.log('running a task every minute');
  const todaysDay=new Date();
  const numberOfDay=todaysDay.getDate();
  console.log(typeof(numberOfDay));
  console.log(todaysDay);
  console.log(numberOfDay);
  const autoSip= await sipCreate.find({sipStartingDayofMonth:numberOfDay});
  
  autoSipShareName=[]; // for live stock price
  autoSipShares=[]; // for transaction update
  autoSip.forEach((ele)=>{
    autoSipShares.push(ele);
    autoSipShareName.push(ele.Sname);
    });

  const apiLivePrice= await allApi(autoSipShareName);
  sharePriceForSip=[];
  apiLivePrice.forEach((ele)=>{
    ele.forEach((e)=>{
      sharePriceForSip.push(e.regularMarketOpen);
      console.log(sharePriceForSip);
    });
  });
  
  
  
 for(let i=0;i<sharePriceForSip.length;i++){
  const transDate=new Date();
  const newTransDatabase= sipT.create({
    id:autoSipShares[i].id,
    Sname:autoSipShares[i].Sname,
    StartingPrice:autoSipShares[i].StartingPrice,
    status:autoSipShares[i].status,
    sipAmount:autoSipShares[i].sipAmount,
    date:transDate,
    transType:autoSipShares[i].transType,
    sharePrice:sharePriceForSip[i],
    transactionCatagory:"sip",
    sector:autoSipShares[i].sector,
    region:autoSipShares[i].region,
  });
}

  const sharePrice=await allApi(autoSipShares);
  
},
{
  scheduled: true,
  timezone: "America/New_York"
});
autoMode.start();
// autoMode.stop();



app.get("/",async(req, res)=>{
  sessionIDNum=req.sessionID;
  req.session.visited=true;
  console.log(sessionIDNum,'from main page');
 const offerPackageData= await OfferPackages.find({});
  res.render("main.ejs",
    {
      token:req.cookies.token,
      name:req.cookies.name,
      offerPackageData:offerPackageData,
      sessionIDNum:sessionIDNum

    }
  );
});

app.get('/login',(req, res)=>{
  // console.log(req.sessionID,"from login");
  req.session.visited=true;
    res.render('login.ejs');
});
app.get('/header',(req, res)=>{
  // console.log(req.sessionID,"from login");
  req.session.visited=true;
  const user_sesssion_id=req.sessionID;
  const Login="Login";
  const Logout="Log Out"
    res.render('component/header.ejs',
      {user_sesssion_id:user_sesssion_id,
        Login:Login,
        Logout:Logout,
      });
});

  //login
app.post('/login',passport.authenticate('local',{
  
  successRedirect:'/product',
  failureRedirect:'/login'
}));

app.get('/signup',(req, res)=>{
         res.render('signup.ejs');
         });
app.post('/signup',async(req,res)=>{
  const{name,email,password,repeatPassword,income,whatsapp}=req.body;
  // console.log(name,email,password,repeatPassword,income);
  try{
    const ExistingUser= await Registration.findOne({email:email});
    if(ExistingUser){
      return res.status(400).json({message:"user already exits"});
    }
    const hashedPassword= await bcrypt.hash(password,10);
    const result= await Registration.create({
      name:name,
      email:email,
      whatsapp:whatsapp,
      password:hashedPassword,
      income:income,
      role:"user",
    });

    const token= jwt.sign({email:result.email,id:result._id},SECRET_KEY,{expiresIn:"1h"});
    result.token=token
    // res.status(201).json({user:result,token:token});
    // res.send({message:"Acount has been created"});
    res.redirect('/login');
  }catch(error){
    console.log(error);
    res.status(500).json({message:"Something went wrong"});
  }
});

app.get('/product',async(req, res)=>{
  sessionIDNum =req.sessionID;
  const offerPackageData= await OfferPackages.find({});
  res.render('product.ejs',{
    offerPackageData:offerPackageData,
    sessionIDNum:sessionIDNum,
  });
});
app.get('/product-package',async(req, res)=>{
  const offerPackageData= await OfferPackages.find({});

  res.render('component/products-content.ejs',{
    offerPackageData:offerPackageData});
});
app.get('/callback',(req, res)=>{
  res.render('get-a-callback.ejs');
 
});
app.post('/callback',(req, res)=>{
  console.log(req.body);
});
app.get('/t&c',(req, res)=>{
  res.render('terms-condition.ejs');
 
});
app.get('/subscribe',(req, res)=>{
  res.render('subscribe.ejs');
 
});
app.get('/main-user',(req, res)=>{
  res.render('main-user.ejs');
 
});
app.get('/create-portfolio',async(req, res)=>{
  const AdminPortfolioData=await AdminPortfolio.find();
  //  aggregation application
  const aggOutput= await AdminPortfolio.aggregate(
    [
      {
        '$unwind': {
          'path': '$transactions', 
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$group': {
          '_id': '$name', 
          'totalShares': {
            '$sum': '$transactions.quantity'
          }, 
          'totalShareValue': {
            '$sum': {
              '$multiply': [
                '$transactions.price', '$transactions.quantity'
              ]
            }
          }
        }
      }
    ]
  );
  // const resultArr = AdminPortfolio.aggregate(aggOutput);
  // console.log (resultArr);
  console.log(typeof(aggOutput));
  adminInputStocks=[];
  aggOutput.forEach((ele)=>{
    adminInputStocks.push(ele._id);
  });
  console.log(adminInputStocks);

  
  // for await (const doc of aggTransactions) {
  //   const calculatedData= [doc];
  //   console.log(calculatedData);
  // }

  try {
      const options = {
      method: 'GET',
      url: 'https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-quotes',
      params: {
        region: 'US',
        symbols: `${adminInputStocks}`
      },
      headers: {
        'x-rapidapi-key': 'bf18da9fa5mshedfa68388a6d7e8p14c5e1jsna967ba37a781',
        'x-rapidapi-host': 'apidojo-yahoo-finance-v1.p.rapidapi.com'
      }
    };
    
    try {
      const response = await axios.request(options);
      // console.log(response.data.quoteResponse.result);
      let allData=await response.data.quoteResponse.result;
      // console.log(allData.language);
      if (allData) {
       return res.render('admin-panel/create-portfolio.ejs',
        {
          allData:allData,
          AdminPortfolioData:AdminPortfolioData,
          // arrayXX2:arrayXX2,
          aggOutput:aggOutput,
          // resultArr:resultArr,
          
        });
       

        
      } else {
        res.send('no data found !!')
      }
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    console.log(error);
  }

});

app.post('/create-portfolio',async(req, res)=>{
  const stockName= req.body.name;
  const StockNameInUpperase= stockName.toUpperCase();
  console.log(StockNameInUpperase);
  // const bidPrice= req.body.bid;
  // const bidAmount= req.body.amount;
  // console.log(bidAmount,bidPrice,stockName);

  

  await AdminPortfolio.create({
            name:StockNameInUpperase,
            // bid:bidPrice,
            // amount:bidAmount,
          });

  const AdminPortfolioData=await AdminPortfolio.find();
  //       stockArray=[];
  //       for (let i = 0; i < AdminPortfolioData.length; i++) {
  //         stockArray.push(AdminPortfolioData[i].name);
  //       }
  //       let stockCommaSeparator= stockArray.join();
  //       console.log(stockCommaSeparator);

   //  aggregation application
  const aggOutput= await AdminPortfolio.aggregate(
    [
      {
        '$unwind': {
          'path': '$transactions', 
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$group': {
          '_id': '$name', 
          'totalShares': {
            '$sum': '$transactions.quantity'
          }, 
          'totalShareValue': {
            '$sum': {
              '$multiply': [
                '$transactions.price', '$transactions.quantity'
              ]
            }
          }
        }
      }
    ]
  );
  // const resultArr = AdminPortfolio.aggregate(aggOutput);
  // console.log (resultArr);
  console.log(typeof(aggOutput));

  adminInputStocks=[];
  aggOutput.forEach((ele)=>{
    adminInputStocks.push(ele._id);
  });
  console.log(adminInputStocks);
     
        
  
  try {
    const options = {
      method: 'GET',
      url: 'https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-quotes',
      params: {
        region: 'US',
        symbols: `${adminInputStocks}`
      },
      headers: {
        'x-rapidapi-key': 'bf18da9fa5mshedfa68388a6d7e8p14c5e1jsna967ba37a781',
        'x-rapidapi-host': 'apidojo-yahoo-finance-v1.p.rapidapi.com'
      }
    };
    
    try {
      const response = await axios.request(options);
      // console.log(response.data.quoteResponse.result);
      let allData=await response.data.quoteResponse.result;
      // console.log(allData.language);
      if (allData) {
        // creating admin database upon admin's stock input
        
        // console.log(allData[0].regularMarketPrice);
        // console.log(allData);
        // return res.json(allData);
        // return res.send("Data fetched from the API");

        
       
       return res.render('admin-panel/create-portfolio.ejs',
        {
          allData:allData,
          AdminPortfolioData:AdminPortfolioData,
          aggOutput:aggOutput,
        });
       

        
      } else {
        res.send('no data found !!')
      }
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    console.log(error);
  }


});

//
app.get('/logout',(req,res,next)=>{
   req.logout(function (err){
    if(err){
      return next(err);
    }
   });
   res.clearCookie('Auth');
   res.clearCookie("token");
   res.redirect('/login');
});
app.get('/logout-admin',(req,res,next)=>{
  req.logout(function (err){
   if(err){
     return next(err);
   }
  });
  res.clearCookie('Auth');
  res.clearCookie("token");
  res.redirect('/admin-login');
});

// for admin panel
app.get('/admin-panel/login',(req,res)=>{
  res.render('admin/login.ejs');
});
app.get('/dashboard',verifyRouteAdmin,(req,res)=>{
  req.session.visited=true;
  res.render('admin-panel/dashboard.ejs');
});
app.get('/user-details',async(req,res)=>{
  const loggedInUser=req.session.user;
  console.log(loggedInUser.name,'from user data');
  const allUsers= await Registration.find();
  // console.log(allUsers);

  res.render('admin-panel/user-details.ejs',{
    allUsers:allUsers,
  });
});
app.get('/search-stock',verifyRouteAdmin,async(req,res)=>{
  try {
    const options = {
      method: 'GET',
      url: 'https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-quotes',
      params: {
        region: 'US',
        symbols: 'AAPL'
      },
      headers: {
        'x-rapidapi-key': 'bf18da9fa5mshedfa68388a6d7e8p14c5e1jsna967ba37a781',
        'x-rapidapi-host': 'apidojo-yahoo-finance-v1.p.rapidapi.com'
      }
    };
    
    try {
      const response = await axios.request(options);
      const StockDataForUser= await(response.data.quoteResponse.result[0]);
      if (StockDataForUser) {
        res.render('admin-panel/search-stocks.ejs',{
          StockDataForUser:StockDataForUser,
        });
      }else{
        return res.send('Stock details not found');
      }
    } catch (error) {
      console.error(error);
    }   
 

  } catch (error) {
    
  }
 

  
});
app.post('/search-stock',async(req,res)=>{
  
    let   scannerArray=['AAPL'];
    const userSearchedStock=req.body.name;
    const arrayStocks =scannerArray.push(userSearchedStock);
    const stockArrayLength= scannerArray.length-1;
    // console.log(stockArrayLength);
     
  try {
    const options = {
      method: 'GET',
      url: 'https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-quotes',
      params: {
        region: 'US',
        symbols: `${scannerArray}`
      },
      headers: {
        'x-rapidapi-key': 'bf18da9fa5mshedfa68388a6d7e8p14c5e1jsna967ba37a781',
        'x-rapidapi-host': 'apidojo-yahoo-finance-v1.p.rapidapi.com'
      }
    };
    
    try {
      const response = await axios.request(options);
      const StockDataForUser= await(response.data.quoteResponse.result[stockArrayLength]);
      // console.log(StockDataForUser);
      
      if (StockDataForUser) {
        res.render('admin-panel/search-stocks.ejs',{
          StockDataForUser:StockDataForUser,
        });
      } else {
        
      }

    } catch (error) {
      console.error(error);
    }

    
  } catch (error) {
    
  }
  
});
app.post('/deleteFromProfile',async(req,res)=>{
  const deleteObject=req.body.delete;
  try {
    await AdminPortfolio.findByIdAndDelete(deleteObject);
    
   } catch (error) {
    console.log(error);
   }
   res.redirect('/create-portfolio');
});
app.post('/addStocksToProfile',async(req,res)=>{
  const deleteObject=req.body;
  try {
    await AdminPortfolio.findByIdAndDelete(deleteObject.addStock);
    
   } catch (error) {
    console.log(error);
   }
   res.redirect('/create-portfolio');
});
app.get('/buy-more',verifyRouteAdmin,async(req,res)=>{
  const buyMoreId=req.query.name;
  const livePrice=req.query.livePrice;
  console.log(livePrice);
  const StockRequest =await AdminPortfolio.find({name:buyMoreId});
  console.log(StockRequest[0].name);
  res.render('admin-panel/buy-more.ejs',{
    StockRequest:StockRequest,
    livePrice:livePrice,
  });
});
app.get('/sell-more',verifyRouteAdmin,async(req,res)=>{
  const buyMoreId=req.query.name;
  const livePrice=req.query.livePrice;
  const StockRequest =await AdminPortfolio.find({name:buyMoreId});
  console.log(StockRequest);
  res.render('admin-panel/sell-more.ejs',{
    StockRequest:StockRequest,
    livePrice:livePrice,
  });
});
app.post('/transactions',verifyRouteAdmin,async(req,res)=>{
  // console.log(req.body);
  try {
   await AdminPortfolio.updateOne({_id:req.body.stockId},{$push:{transactions:{
    price:req.body.price,
    quantity:req.body.quantity,
    tType:req.body.transactionType,
    date:Date.now(),
   }}})
   .then(result => { 
    console.log(result) 
   });
  } catch (error) {
    
  }
  // return res.send("Post updated");
  res.redirect('/create-portfolio');
});
app.post('/sell-transactions',verifyRouteAdmin,async(req,res)=>{
  // console.log(req.body);
  try {
   await AdminPortfolio.updateOne({_id:req.body.stockId},{$push:{transactions:{
    price:(req.body.price)*(-1),
    quantity:(req.body.quantity)*(-1),
    tType:req.body.transactionType,
    date:Date.now(),
   }}})
   .then(result => { 
    console.log(result) 
   });
  } catch (error) {
    console.log(error);
  }
  // return res.send("Post updated");
  res.redirect('/create-portfolio');
});
app.get('/create-card',verifyRouteAdmin,(req,res)=>{
  res.render('admin-panel/create-card.ejs');
});
app.post('/packages',verifyRouteAdmin,async(req,res)=>{
  const {name,highlight,fld1,fld2,fld3,fld4,price}=req.body;
   try {
    const allPackages = await OfferPackages.create({
    name:name,
    highlight:highlight,
    fld1:fld1,
    fld2:fld2,
    fld3:fld3,
    fld4:fld4,
    price:price,
  });
 res.redirect('/stockPackages');
  } catch (error) {
    console.log(error);
  }
});
app.get('/stockPackages',verifyRouteAdmin,async(req,res)=>{
  
 try {
  const allStockpackage =await OfferPackages.find({});
  const packagesArray=[];
  const arrayOfPackage= 
  res.render('admin-panel/packages.ejs',{
    allStockpackage:allStockpackage,
  })
 } catch (error) {
  console.log(error);
 }
});
app.get('/stockPackagesUser',async(req,res)=>{
  
  try {
   const allStockpackage =await OfferPackages.find({});
   const packagesArray=[];
   
   res.render('component/stockPackagesUser.ejs',{
     allStockpackage:allStockpackage,
   })
  } catch (error) {
   console.log(error);
  }
 });
 

app.get('/insert-stock',verifyRouteAdmin,(req,res)=>{
  res.render('admin-panel/insert-stock.ejs');
});

app.get('/api',(req,res)=>{
  
});
app.get('/createSip',verifyRouteAdmin,(req,res)=>{
  res.render('admin-panel/createSip.ejs')
});
app.post('/createSipPost',async(req,res)=>{

try {
  const{name,status,details}=req.body;
  console.log(name);

  const sipPortfolio = await sip.create({
    name:name,
    status:status,
    details:details,
    transactions:'',
  });
 res.redirect('/createSipDetails');
} catch (error) {
  console.log(error);
}


  // res.render('admin-panel/createSip.ejs')
});
app.get('/createSipDetails',verifyRouteAdmin,async(req,res)=>{
  // res.render('admin-panel/createSip.ejs')
  try {
    const sipDetails= await sip.find({});
    console.log(sipDetails);
    res.render('admin-panel/createSipDetails.ejs',{
      sipDetails:sipDetails,
    });
  } catch (error) {
    
  }
});
app.get('/sipAddStocks',verifyRouteAdmin,async(req,res)=>{
  
  try {
    console.log(req.query.id,'from sip created')
    const queryId=req.query.id;
    const allSipCreated= await sipCreate.find({id:queryId}).sort({sipStartingDate:-1});
    console.log(allSipCreated);
    const allDataSip= await sip.findOne({_id:queryId});
    console.log(allDataSip);
    if (allDataSip) {
      res.render('admin-panel/sipAddStocks.ejs',{
        allDataSip:allDataSip,
        queryId:queryId,
        allSipCreated:allSipCreated
      });
    } else {
      return res.send('No data found ! try again with different Id');
    }
  } catch (error) {
    console.log(error);
  }
});
app.post('/sipPush',verifyRouteAdmin,async(req,res)=>{
  try {  
  const reqId=req.body.id;
  console.log(reqId);
  console.log(req.body);
  stockNameForSipPush=req.body.name;
  dateForSipPush=req.body.sipStartingDate;
  // console.log(typeof(dateForSipPush));
const Ndate=new Date(dateForSipPush).getDate(); 
const dateNow=Date.now(); 
// here we created the sip
  await sipCreate.create({
    id:req.body.id,
    Sname:req.body.name,
    date:`${dateNow}`,
    StartingPrice:req.body.startingprice,
    status:req.body.status,
    sipAmount:req.body.sipAmount,
    sipStartingDate:req.body.sipStartingDate,
    sipStartingDayofMonth:`${Ndate}`,
    catagory:req.body.catagory,
    region:req.body.region,
    sector:req.body.sector,
  })
  .then((result,error) => { 
    if(result){
      console.log(result);
       res.redirect('/sipCompanyDetails');
    }else{
      console.log('Murdered !! Opps')
    }
   });
   
  } catch (error) {
    console.log(error);
  }

});
app.get('/api',(req,res)=>{
  
});
app.get('/sipCompanyDetails',verifyRouteAdmin,async(req,res)=>{
  const reqId=req.query.id;
  const sipDetails= await sip.find({_id:reqId});//for sip detail dispay
  // for cash position data.......................//
  const cashLastItem= await cashHolding.find().sort({_id:-1}).limit(1);
  // for allocation data
  const allocation= await ca.find().sort({date:-1}).limit(1);
 let cashItem=[];
 cashLastItem.forEach((ele)=>{
  cashItem.push(ele.cash);
  // console.log(cashItem);
 })
 //............... end of cash postion logic...............//
 try {
      const sipTransactions= await sipT.find({id:reqId});
      // console.log(sipTransactions);
      const modifiedAggData= await sipT.aggregate(
        [
          {
            '$addFields': {
              'avarageSipBuyingprice': {
                '$divide': [
                  '$sipAmount', '$sharePrice'
                ]
              }, 
              'avarageLumpsumpBuyingPrice': {
                '$divide': [
                  '$topupAmount', '$sharePrice'
                ]
              }
            }
          }, {
            '$sort': {
              'date': 1
            }
          }, {
            '$group': {
              '_id': '$Sname', 
              'firstSipPrice': {
                '$first': '$sharePrice'
              }, 
              'sector': {
                '$last': '$sector'
              }, 
              'region': {
                '$last': '$region'
              }, 
              'topupAmount': {
                '$sum': '$topupAmount'
              }, 
              'transId': {
                '$first': '$id'
              }, 
              'startingDate': {
                '$first': '$date'
              }, 
              'sipAmount': {
                '$first': '$sipAmount'
              }, 
              'sipStatus': {
                '$last': '$status'
              }, 
              'totalSipValue': {
                '$sum': '$sipAmount'
              }, 
              'cashOutValue': {
                '$sum': '$cashOutAmount'
              }, 
              'cashOutPrice': {
                '$last': '$cashOutPrice'
              }, 
              'cashOutDate': {
                '$last': '$cashOutDate'
              }, 
              'totalLumpsumValue': {
                '$sum': '$topupAmount'
              }, 
              'totalSipShare': {
                '$sum': {
                  '$divide': [
                    '$sipAmount', '$sharePrice'
                  ]
                }
              }, 
              'totalLumpsumpShare': {
                '$sum': {
                  '$divide': [
                    '$topupAmount', '$sharePrice'
                  ]
                }
              }, 
              'sipAvaragePrice': {
                '$avg': '$sharePrice'
              }
            }
          }, {
            '$project': {
              '_id': 1, 
              'sector': 1, 
              'region': 1, 
              'transId': 1, 
              'firstSipPrice': 1, 
              'sipStatus': 1, 
              'sipAmount': 1, 
              'topupAmount': 1, 
              'startingDate': 1, 
              'totalSipValue': 1, 
              'totalLumpsumValue': 1, 
              'totalSipShare': 1, 
              'cashOutValue': 1, 
              'cashOutPrice': 1, 
              'cashOutDate': 1, 
              'totalLumpsumpShare': 1, 
              'sipAvaragePrice': 1, 
              'lumpsumAvaragePrice': 1,
              'sipStartingDateTwo':{
                '$dateToString':{
                  format: "%Y-%m-%d", date: "$startingDate"
                }
              }, 
              'cashOutDateTwo':{
                 '$dateToString':{
                  format: "%Y-%m-%d", date: "$cashOutDate"
                 }
              },
              'totalValue': {
                '$add': [
                  '$totalSipValue', '$totalLumpsumValue'
                ]
              }, 
              'totalShareQty': {
                '$sum': {
                  '$add': [
                    '$totalSipShare', '$totalLumpsumShare'
                  ]
                }
              }
            }
          }
        ]
      );
      console.log(modifiedAggData);
      
     //data for chart
     const portfolioShareValue=[];
     modifiedAggData.forEach((ele)=>{
      portfolioShareValue.push(ele.totalSipValue);
     });
      console.log(modifiedAggData);
   
      stockNameForSip=[];// for data from database
      modifiedAggData.forEach((ele)=>{
        stockNameForSip.push(ele._id);
      });
      console.log(stockNameForSip);
    const allSipdata= await allApi(stockNameForSip);

    const stockNamePrice=[];// for live price
    allSipdata.forEach((ele)=>{
      ele.forEach((e)=>{
        stockNamePrice.push(e);
        // console.log(stockNamePrice);
      })
    })
   

  res.render('admin-panel/sipCompanyDetails.ejs',{
    sipDetails:sipDetails,
    stockNamePrice:stockNamePrice,
    modifiedAggData:modifiedAggData,
    sipTransactions:sipTransactions,
    portfolioShareValue:portfolioShareValue,
    cashItem:cashItem,
    allocation:allocation
  });
    
 } catch (error) {
  console.log(error);
 }

});
app.get('/add-lumpsum',verifyRouteAdmin,async(req,res)=>{
  try {
    const rootid=req.query.id;
    const stockNamm=req.query.stockName;
    const stockPPrice= req.query.stockPrice;

    res.render('admin-panel/addLumpsum.ejs',{
      rootid:rootid,
      stockNamm:stockNamm,
      stockPPrice:stockPPrice,
      

    });
  } catch (error) {
    console.log(error);
  }
});
app.post('/sipLumpsumpPush',async(req,res)=>{
stockId=req.body.ssid;
stockN=req.body.name,
stockP=req.body.price,
stockAmount=req.body.amount
console.log(stockId,stockN,stockP,stockAmount)
 if(stockId && stockN &&stockP &stockAmount){
  const transDate=new Date();
  const newTransDatabase= sipT.create({
    id:req.body.ssid,
    Sname:req.body.name,
    StartingPrice:'',
    status:'',
    cashOutAmount:0,
    topupAmount:req.body.amount,
    sipAmount:0,
    date:transDate,
    transType:"buy",
    sharePrice:req.body.price,
    transactionCatagory:"lumpsum",
  }) 
  res.redirect('/sipCompanyDetails');
 
}else{
  res.send("Please fill all field !");
}

});
app.get('/cashout-lumpsum',verifyRouteAdmin,async(req,res)=>{
  try {
    const rootid=req.query.id;
    const stockNamm=req.query.stockName;
    const stockPPrice= req.query.stockPrice;

    res.render('admin-panel/cashOut.ejs',{
      rootid:rootid,
      stockNamm:stockNamm,
      stockPPrice:stockPPrice,
      

    });
  } catch (error) {
    console.log(error);
  }
});

app.post('/sipLumpsumpPop',(req,res)=>{
  stockId=req.body.ssid;
stockN=req.body.name,
stockP=req.body.price,
stockAmount=(req.body.amount)*(-1);
console.log(stockId,stockN,stockP,stockAmount)
 if(stockId && stockN &&stockP &stockAmount){
  const transDate=new Date();
  const newTransDatabase= sipT.create({
    id:req.body.ssid,
    Sname:req.body.name,
    StartingPrice:'',
    status:'',
    topupAmount:0,
    cashOutAmount:stockAmount,
    sipAmount:0,
    date:transDate,
    cashOutDate:transDate,
    cashOutPrice:stockP,
    transType:"Lumpsum",
    sharePrice:req.body.price,
    transactionCatagory:"Sell",
  }) 
  res.redirect('/sipCompanyDetails');
 
}else{
  res.send("Please fill all field !");
}
});
app.get('/cash-position',verifyRouteAdmin,async(req,res)=>{
  const cashLastItem= await cashHolding.find().sort({_id:-1}).limit(1);
 let cashItem=[];
 cashLastItem.forEach((ele)=>{
  cashItem.push(ele.cash);
  // console.log(cashItem);
 })
  res.render('admin-panel/cashPosition.ejs',{cashItem:cashItem});
});
app.post('/cashHoldingPost',async(req,res)=>{
  console.log(req.body);
  if(req.body.cash){
   await  cashHolding.create(req.body)
    .then(()=>{
      res.redirect('/sipCompanyDetails');
       
    })
  }else{
    return res.send("No value entered ! Try again")
  }
});

app.get('/user-portfolio',async(req,res)=>{
  if(req.isAuthenticated()){
    const reqId=req.query.id;
  const sipDetails= await sip.find({_id:reqId});//for sip detail dispay
  // for cash position data.......................//
  const cashLastItem= await cashHolding.find().sort({_id:-1}).limit(1);
  // for allocation data
  const allocation= await ca.find().sort({date:-1}).limit(1);
 let cashItem=[];
 cashLastItem.forEach((ele)=>{
  cashItem.push(ele.cash);
  // console.log(cashItem);
 })
 //............... end of cash postion logic...............//
 try {
      const sipTransactions= await sipT.find({id:reqId});
      // console.log(sipTransactions);
      const modifiedAggData= await sipT.aggregate(
        [
          {
            '$addFields': {
              'avarageSipBuyingprice': {
                '$divide': [
                  '$sipAmount', '$sharePrice'
                ]
              }, 
              'avarageLumpsumpBuyingPrice': {
                '$divide': [
                  '$topupAmount', '$sharePrice'
                ]
              }
            }
          }, {
            '$sort': {
              'date': 1
            }
          }, {
            '$group': {
              '_id': '$Sname', 
              'firstSipPrice': {
                '$first': '$sharePrice'
              }, 
              'sector': {
                '$last': '$sector'
              }, 
              'region': {
                '$last': '$region'
              }, 
              'topupAmount': {
                '$sum': '$topupAmount'
              }, 
              'transId': {
                '$first': '$id'
              }, 
              'startingDate': {
                '$first': '$date'
              }, 
              'sipAmount': {
                '$first': '$sipAmount'
              }, 
              'sipStatus': {
                '$last': '$status'
              }, 
              'totalSipValue': {
                '$sum': '$sipAmount'
              }, 
              'cashOutValue': {
                '$sum': '$cashOutAmount'
              }, 
              'cashOutPrice': {
                '$last': '$cashOutPrice'
              }, 
              'cashOutDate': {
                '$last': '$cashOutDate'
              }, 
              'totalLumpsumValue': {
                '$sum': '$topupAmount'
              }, 
              'totalSipShare': {
                '$sum': {
                  '$divide': [
                    '$sipAmount', '$sharePrice'
                  ]
                }
              }, 
              'totalLumpsumpShare': {
                '$sum': {
                  '$divide': [
                    '$topupAmount', '$sharePrice'
                  ]
                }
              }, 
              'sipAvaragePrice': {
                '$avg': '$sharePrice'
              }
            }
          }, {
            '$project': {
              '_id': 1, 
              'sector': 1, 
              'region': 1, 
              'transId': 1, 
              'firstSipPrice': 1, 
              'sipStatus': 1, 
              'sipAmount': 1, 
              'topupAmount': 1, 
              'startingDate': 1, 
              'totalSipValue': 1, 
              'totalLumpsumValue': 1, 
              'totalSipShare': 1, 
              'cashOutValue': 1, 
              'cashOutPrice': 1, 
              'cashOutDate': 1, 
              'totalLumpsumpShare': 1, 
              'sipAvaragePrice': 1, 
              'lumpsumAvaragePrice': 1,
              'sipStartingDateTwo':{
                '$dateToString':{
                  format: "%Y-%m-%d", date: "$startingDate"
                }
              }, 
              'cashOutDateTwo':{
                 '$dateToString':{
                  format: "%Y-%m-%d", date: "$cashOutDate"
                 }
              },
              'totalValue': {
                '$add': [
                  '$totalSipValue', '$totalLumpsumValue'
                ]
              }, 
              'totalShareQty': {
                '$sum': {
                  '$add': [
                    '$totalSipShare', '$totalLumpsumShare'
                  ]
                }
              }
            }
          }
        ]
      );
      // console.log(modifiedAggData);
      
     //data for chart
     const portfolioShareValue=[];
     modifiedAggData.forEach((ele)=>{
      portfolioShareValue.push(ele.totalSipValue);
     });
      // console.log(modifiedAggData);
   
      stockNameForSip=[];// for data from database
      modifiedAggData.forEach((ele)=>{
        stockNameForSip.push(ele._id);
      });
      // console.log(stockNameForSip);
    const allSipdata= await allApi(stockNameForSip);

    const stockNamePrice=[];// for live price
    allSipdata.forEach((ele)=>{
      ele.forEach((e)=>{
        stockNamePrice.push(e);
        // console.log(stockNamePrice);
      })
    })
   const userName=req.user.username;
   const userEmail=req.user.email;
   console.log(userEmail);
   const userId=req.user.id;
   console.log(userName);
   const subscribeData=await payment.find({email:userEmail}).sort({date:-1}).limit(1);
   console.log(subscribeData);
   const currentDate=new Date().toLocaleDateString("en-GB");
   console.log(currentDate);
  //  const expairyDate=subscribeData[0].exp_date.toLocaleDateString("en-GB");
  res.render('user-portfolio.ejs',{
    sipDetails:sipDetails,
    stockNamePrice:stockNamePrice,
    modifiedAggData:modifiedAggData,
    sipTransactions:sipTransactions,
    portfolioShareValue:portfolioShareValue,
    cashItem:cashItem,
    subscribeData:subscribeData,
    userEmail:userEmail,
    userId:userId,
    reqId:reqId,
    // expairyDate:expairyDate,
    currentDate:currentDate,
    allocation:allocation
  });
    
 } catch (error) {
  console.log(error);
 }
  }else{
    res.redirect('/login');
  }
})

app.get('/payment',async(req,res)=>{
  const packageIdOne=req.query.packageId;
  console.log(packageIdOne);
 const packageData=await OfferPackages.find({_id:packageIdOne})
  console.log(packageData);
  const userId=req.query.id;
  const userEmail=req.query.email;
  if(req.isAuthenticated){
    res.render('payment.ejs',{
      userId:userId,
      userEmail:userEmail,
      packageId:packageIdOne,
      packageData:packageData
    });
  }else{
    res.redirect('/login');
  }
})

app.post('/checkout',async(req,res)=>{
  const userId=req.query.userId;// for find user
  const email=req.query.userEmail;
  const packageId=req.query.packageId;
  const packageAmount=req.query.packageAmount;
  const packageData=await OfferPackages.findOne({_id:packageId});
  if(req.isAuthenticated){
    const session=await stripe.checkout.sessions.create({
      line_items:[
        {
          price_data:{
            currency:'usd',
            product_data:{
              name:packageData.name,
               },
            unit_amount:packageAmount*100
          },
          quantity:1
        }
      ],
      mode:'payment',
      success_url:'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:'http://localhost:3000/cancel'
    })
    res.redirect(session.url);
  }else{
    res.redirect('/login');
  }
});
app.get('/success',async(req,res)=>{
 
  const result=Promise.all([stripe.checkout.sessions.retrieve(req.query.session_id,{expand:['payment_intent.payment_method']}),
  stripe.checkout.sessions.listLineItems(req.query.session_id)
  ]);
  const session = await stripe.checkout.sessions.retrieve(
    req.query.session_id,
  );
  const lineItems = await stripe.checkout.sessions.listLineItems(
    req.query.session_id,
  );
  
  // const session= await stripe.checkout.sessions.retrieve(req.query.session_id,{expand:['payment_intent.payment_method']});
  // const lineItems=await stripe.checkout.sessions.listLineItems(req.query.session_id);
  // const jsoneData=JSON.stringify(await result);
  // const jsoneData=JSON.stringify(await result);
  // console.log(lineItems);
  // console.log(session.payment_status);
  const d = new Date();
  d.setDate(d.getDate() + 365);
  console.log(d);

  if(session.payment_status){
     await payment.create({
      name: session.customer_details.name,
      email:session.customer_details.email,
      price:session.amount_total,
      paymentStatus:session.payment_status,
      currency:session.currency,
      paymentMethod:session. payment_method_types,
      product:lineItems.data[0].description,
      transactionDate:session.created,
      exp_date: new Date().setDate(new Date().getDate()+365),
     });
  }

  const paymentDetails= await payment.find({email:session.customer_details.email}).sort({date:-1}).limit(1);
  console.log(paymentDetails);
  res.render('payment-success.ejs',{
    session:session,
    lineItems:lineItems,
    paymentDetails:paymentDetails
  });
});
app.get('/cancel',(req,res)=>{
  res.send('payment canceled')
});

app.get('/subscription',async(req,res)=>{
  const subscription=await payment.find({});
  console.log(subscription);
  res.render('admin-panel/subscriptionData.ejs',{
    subscription:subscription,
  });
});
app.get('/landing-page',(req,res)=>{
  res.render('landingPage.ejs');
});
app.get('/subscribe-page',(req,res)=>{
  res.render('subscribe-page.ejs');
});
app.get('/admin-login',(req,res)=>{
  res.render('admin-panel/adminLogin.ejs');
});
app.post('/deleteFromSip',async(req,res)=>{
  const deleteObject=req.body.sipId;
  try {
    await sip.findByIdAndDelete(deleteObject);
    
   } catch (error) {
    console.log(error);
   }
   res.redirect('/createSipDetails');
});
app.get('/updateSip',verifyRouteAdmin,async(req,res)=>{
  const sipId=req.query.id;
  const sipData=await sip.find({_id:sipId});
  console.log(sipData);
  if(sipData){
    res.render('admin-panel/updateSip.ejs',{sipData:sipData});
  }else{
    return res.send('No data found');
  }
  
});
app.post('/updateSipPost',verifyRouteAdmin,async(req,res)=>{
  const sipID=req.body.sipid;
  const newName=req.body.name;
  const newStatus=req.body.status;
  const newDetails=req.body.details;
   const updatedData=await sip.findByIdAndUpdate(sipID,{name:newName,status:newStatus,details:newDetails},{new:true,runValidators:true});
   res.redirect('/createSipDetails');
})
app.post('/admin-login',async(req,res)=>{
  const userName=req.body.username;
  const password=req.body.password;
  const adminLoginData= await adminRegistrationExport.findOne({email:userName});
  if(adminLoginData.password===password){
    req.session.user=adminLoginData;
      req.session.email = adminLoginData.email;
      req.session.role=adminLoginData.role;
      req.session.name= adminLoginData.name;
      req.session.cookie.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      console.log(req.session.email,req.session.role,"from login");
      console.log(req.session.cookie);
      const accessToken = jwt.sign(
        {
          "userInfo":{
            "email": adminLoginData.email,
            "name": adminLoginData.name,
            "role": adminLoginData.role
          }
        },
        'JSONKEY',
        {
          expiresIn :'24hr'
        });
        // console.log(accessToken,"token");

        res.cookie('token', accessToken);
       res.render('admin-panel/dashboard.ejs');
  }else{
    res.redirect('/admin-login');
  }
  
});
app.get('/manageAdmin',verifyRouteAdmin,(req,res)=>{
  res.render('admin-panel/manageAdmin.ejs');
});
app.post('/manageAdmin',async(req,res)=>{
  const formData=(req.body.name);
 if(formData.length===0){
 return res.send('Please put value in the form');
 }else{
   const adminData= await adminRegistrationExport.create({
      name:req.body.name,
      email:req.body.email,
      password:req.body.password,
    }).then(()=>{
      const messageData="Admin account for"+" " +req.body.name +" "+"Created";
      return res.send(messageData);
    })
 }
  
});
app.get('/contribution-allocation',verifyRouteAdmin,async(req,res)=>{
  const data= await ca.find({}).sort({date:-1}).limit(1);
  res.render('admin-panel/ca.ejs',{
    data:data
  });
});
app.post('/contribution-allocation',verifyRouteAdmin,async(req,res)=>{
  if(req.body){
   await ca.create({
    sip:req.body.sip,
    cash:req.body.cashPerentage,
    equity:req.body.equityPerentage
   });
  }
  const data= await ca.find({}).sort({date:-1}).limit(1);
  res.render('admin-panel/ca.ejs',{data:data})
})
app.get('/sip-transactions',async(req,res)=>{
  const sipTransactionData=await sipT.find({}).sort({date:-1});
  res.render('admin-panel/sipTransactions.ejs',{sipTransactionData:sipTransactionData});
});

app.post('/deleteTransactions',async(req,res)=>{
  deleteId=req.body.deleteId;
  if(deleteId){
    await sipT.findByIdAndDelete({_id:deleteId});
    res.redirect('/sip-transactions');
  }else{
    return res.send('No item found to delete !');
  }
})
//login via passport
passport.use(new LocalStrategy(async function verify(username,password,cb){
  // console.log(username,'from passport');
  try {
    const user= await Registration.findOne({email:username});
    console.log(user,'from passport ext')
    if (user) {
      const matchPassword=  bcrypt.compare(password,user.password,(err,result)=>{
        console.log(matchPassword);
        if(err){
          console.error('Error comparing password');
        }else{
          if(result){
            console.log(user,'from passport result')
            return cb(null,user)
          }else{
            return cb (null, false);
          }
        }
      });
    }
   
  } catch (error) {
    console.log(error);
    
  }
}));
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user._id,
      username: user.name,
      email:user.email,
      role:user.role,
      date:user.date,
    });
  });
});
passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

app.listen(process.env.PORT || `${port}`,()=>{
    console.log(`server started at port ${port}.`);
});