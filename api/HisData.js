const axios= require('axios');

async function hisData(data){
  // console.log(data);
  let params = data;
  if(params === undefined){
    return;
  }else{
    params= data;
  }
  console.log(params,"aapppppppiiiiiiii");
  // return "hello";
  // const params= data;
  // console.log(params);
  const sendData= [];
const options = {
  method: 'GET',
  url: 'https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v3/get-historical-data',
  params: {
    region: 'US',
    symbols: `${params}`
  },
  headers: {
    'X-RapidAPI-Key': 'bf18da9fa5mshedfa68388a6d7e8p14c5e1jsna967ba37a781',
    'X-RapidAPI-Host': 'apidojo-yahoo-finance-v1.p.rapidapi.com'
  }
};

try {
	const response = await axios.request(options);
	// console.log(response.data.quoteResponse, "aasdasd");
  const data = response.data.quoteResponse;
  sendData.push(response.data.quoteResponse.result);
} catch (error) {
	console.error(error);
}
// console.log(sendData);
  return sendData;
}

module.exports= {hisData};
