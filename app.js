const express = require('express');
const app = express();
const multer = require('multer');
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieparser=require('cookie-parser');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const post = require('./models/post');
const upload = require('./config/multerconfig');
const path=require('path');
app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieparser());
app.use(express.static(path.join(__dirname,'public')));

app.get('/',(req,res)=>
{
    res.render('index');
})
app.get('/login',(req,res)=>
{
    res.render('login.ejs');
})
app.get('/profile',isLoggedIn,async (req,res)=>
{
    let user=await userModel.findOne({email:req.user.email}). populate('posts');
    res.render('profile.ejs',{user});
})
app.get('/profile/upload' , (req,res)=>
{
    res.render('profilepic');
})
app.post('/upload',isLoggedIn,upload.single("images"),async (req,res)=>{
let user = await userModel.findOne({email:req.user.email})
user.images=req.file.filename;
await user.save();
res.redirect('/profile');
})

app.post('/post', isLoggedIn, async(req,res)=>
{
 let user = await userModel.findOne({email:req.user.email});
 let {content}=req.body;
 let post = await postModel.create
 ({
user: user._id,
content
 })
 user.posts.push(post._id);
 await user.save();
 res.redirect('/profile');
})
app.post('/like/:id',isLoggedIn,async (req,res)=>
{
 let post = await postModel.findOne({_id: req.params.id}).populate("user");
 if(post.likes.indexOf(req.user.userid)===-1){
     post.likes.push(req.user.userid);
 }
else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1);
}
 await post.save();
 res.redirect('/profile');
})
app.post('/register',async(req,res)=>
{
    let {email,password,username,age,name}=req.body;
    let user = await userModel.findOne({email});
    if(user) res.status(500).send('user already registeres !!');
    else 
    {
        bcrypt.genSalt(10,(err,salt)=>
        {
            bcrypt.hash(password,salt,async (err,hash)=>
            {
                let user = await userModel.create(
                    {
                        username,
                        email,
                        name,
                        age,
                        password:hash
                    }
                )
                let token=jwt.sign({email,userid:user._id},"secret");
                res.cookie('token',token);
                res.send('user created');
            })
        })
    }
})
app.get('/edit/:id',isLoggedIn,async (req,res)=>
{
    let post=await postModel.findOne({_id:req.params.id}).populate('user');
    res.render('edit',{post});
})
app.post('/update/:id',isLoggedIn,async(req,res)=>{
let post=await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content});
res.redirect('/profile');
}
)
app.post('/login', async (req,res)=>
{
    let {email,password}=req.body;
    let user = await userModel.findOne({email});
    if(!user) res.status(500).send('something went wrong!!');
    else
    {
        bcrypt.compare(password,user.password,(err,result)=>
        {
            if(result) {
                let token=jwt.sign({email,userid:user._id},"secret");
                res.cookie('token',token);
                res.status(200).redirect('/profile');
            }
            else
            {
                res.redirect('/login');
            }
        })
    }

})
app.get('/logout',(req,res)=>
{
    res.cookie('token',"");
    res.redirect('/login');
})
function isLoggedIn(req,res,next)
{
if(req.cookies.token==="") res.send("you must login first");
else 
{
   let data = jwt.verify(req.cookies.token,"secret");
   req.user = data;
   next();
}

}
app.listen(3000, ()=>
{
    console.log('port 3000 is working');
})