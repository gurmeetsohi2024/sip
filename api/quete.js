const axios = require('axios');
const { response } = require('express');

const queteData= async(req,res)=>{
    try {
        const options = {
            method: 'GET',
            url: 'https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-summary',
            params: {region: 'US'},
            headers: {
              'x-rapidapi-key': 'bf18da9fa5mshedfa68388a6d7e8p14c5e1jsna967ba37a781',
              'x-rapidapi-host': 'apidojo-yahoo-finance-v1.p.rapidapi.com'
            }
          };
          
          try {
              const response = await axios.request(options);
            //   console.log(response);
            //   console.log(response.data);
            // console.log(response.data.marketSummaryAndSparkResponse.result[0]);
            
            console.log(response.data.marketSummaryAndSparkResponse.result[0]);
          } catch (error) {
              console.error(error);
          }

    } catch (error) {
        console.log(error)
    }
}

module.exports=queteData;
