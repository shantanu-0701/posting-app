const mongoose = require('mongoose');
mongoose.connect(`mongodb://127.0.0.1:27017/miniproject`);
const userSchema = mongoose.Schema(
    {
        name:String,
        email:String,
        username:String,
        password:String,
        age:Number,
        images :{
            type:String,
            default:'default.jpg'
        },
        posts:[{type:mongoose.Schema.Types.ObjectId,ref:"post"}]
    }
);
module.exports = mongoose.model('user',userSchema);