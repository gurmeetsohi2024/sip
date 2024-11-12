const jwt=require("jsonwebtoken");


const verifyRouteAdmin = async(req,res,next)=>{
    let token = req.cookies.token;
    jwt.verify(token,'JSONKEY',(err,decode)=>{
        if(err){
            console.log(err)
            res.redirect('/admin-login');
        }else{
            console.log("decoded");
            if(decode.userInfo.role == 'admin'){
                next();
            }else{
                res.redirect("/admin-login")
            }
            // console.log(decode,"ddddddddd");
            return decode;
        }
    })
    // next();

}


module.exports = {verifyRouteAdmin}