var jwt = require('jsonwebtoken');
SECRET_KEY="SECRET_key_4587";

const auth=(req,res,next)=>{
    try {
        let token=req.cookies.token;
        console.log(req.cookies);
        if(!token){
            res.redirect('/login');
        }
       
        if(token){
            // token=token.split(" ")[1];
           
            let user=jwt.verify(token,SECRET_KEY);
            req.userId=user.id;
        }
        next();
    } catch (error) {
        console.log(error);
    }
}


module.exports={auth};