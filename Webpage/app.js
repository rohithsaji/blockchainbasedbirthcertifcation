var express=require("express");
var app=express();
var request=require("request");
var bodyParser=require("body-parser");
var flash=require("connect-flash");
var passport=require("passport");
app.use(flash());

app.use(require("express-session")({
    secret:"Se project",
    resave: false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req,res,next){
    res.locals.error=req.flash("error");
    res.locals.success=req.flash("success");
    next();
});

app.use(bodyParser.urlencoded({extended: true}));

app.get("/",function(req,res){
    res.render("landing.ejs");
});
app.get("/addrecord",function(req,res){
    res.render("addrecord.ejs");
});
app.get("/allrecord",function(req,res){
    var Url="http://0.0.0.0:5000/get_chain";
    request(Url,function(er,response){
        if(!er && res.statusCode==200){
            var Body=JSON.parse(response.body);
            console.log(Body);
            res.render("allrecord.ejs",{data:Body});
        }
    });
});
app.get("/getrecord",function(req,res){
    res.render("getrecord.ejs");
})
app.get("/mineblock",function(req,res){
    var Url="http://0.0.0.0:5000/mine_block";
    request(Url,function(error,response){
        if(!error && response.statusCode==200)
        {
            var Body=JSON.parse(response.body);
            console.log(Body);
            var Index=Body.index;
            if(Body.transactions.length<=0){
                req.flash("error","No records to be mined!");
                res.redirect("/");
            }
            else{
                req.flash("success","Block has been mined!");
                res.redirect("/");
            }
            
        }
        else{
            console.log(error);
            req.flash("error","Error try again!");
            res.redirect("/");
        }

    });

});
app.post("/addrecord",function(req,res){
    var Url="http://0.0.0.0:5000/add_record";
    console.log(req.body.Firstn);
    const newdata={
        "fname" :req.body.Firstn,
        "lname":req.body.Lastn,
        "Location":req.body.location,
        "dob":req.body.dob,
        "certifiedby":req.body.certifby,
        "time":req.body.tob
    }
    console.log(newdata);
    request({
        url: Url,
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        json: newdata
    },function(error,response){
        if(!error && response.statusCode==201)
        {
            console.log(response);
            // console.log(Body);
            req.flash("success",response.body.message);
            res.redirect("/");
            
        }
        else{
            console.log(error);
            req.flash("error","Please ensure all attributes are filled.");
            res.redirect("/");
        }

    });
});

app.get("/fetchrecord",function(req,res){
    var Url="http://0.0.0.0:5000/get_record";
    const toFind={
        "index":req.query.index,
        "Id": req.query.id
    }
    request({
        url: Url,
        method: "GET",
        headers: {
            "content-type": "application/json"
        },
        json: toFind
    },function(error,response,body){
        if(!error && response.statusCode==200)
        {
            console.log(body);
            res.render("results.ejs",{data : body})
        }
        else if(response.statusCode==400){
            req.flash("error","Record Doesnt exist for id sent!");
            res.redirect("/");
        }
        else{
            req.flash("error","Error has occured go back and try again");
            res.redirect("/");
        }

    });
});
app.get("*",function(req,res){
    res.redirect("/");
})
app.listen(9999,function(){
    console.log("server started");
});