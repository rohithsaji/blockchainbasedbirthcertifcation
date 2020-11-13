var express=require("express");
var app=express();
var request=require("request");
var bodyParser=require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));

app.get("/",function(req,res){
    res.render("landing.ejs");
});
app.get("/addrecord",function(req,res){
    res.render("addrecord.ejs");
});
app.get("/allrecord",function(req,res){
    res.render("allrecord.ejs");
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
            var ID=Body.transactions[0].Id;
            console.log(Index);
            console.log(ID);

            const msg="Block has been mined!"
            res.render("displaynew.ejs",{msg : msg,index: Index,id:ID})
            
        }
        else{
            console.log(error);
            const msg="Error try again"
            res.render("display.ejs",{msg : msg});
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
            const msg="New record is added and waiting to be mined(Mine to view in blockchain)"
            res.render("displayadd.ejs",{msg : msg})
            
        }
        else{
            console.log(error);
            const msg="Please ensure all attributes are filled."
            res.render("display.ejs",{msg : msg});
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
            const msg="Record Doesnt exist for id sent!"
            res.render("display.ejs",{msg : msg});
        }
        else{
            res.send("error has occured go baxk and try again");
        }

    });
});
app.get("*",function(req,res){
    res.redirect("/");
})
app.listen(9999,function(){
    console.log("server started");
});