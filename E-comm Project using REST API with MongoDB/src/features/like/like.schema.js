import mongoose from "mongoose";

export const likeSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    likeable:{
        type: mongoose.Schema.Types.ObjectId,
        refPath:'on_model'//this will be a separate attribute , which specify which type of objects can appear here, i.e product or catagory
    },
    on_model:{
        type:String,
        enum:['Product','Category']
    }
    
    // Mongoose Middleware
}).pre('save', (next)=>{
    console.log("New like coming in");
    next();
})
.post('save', (doc)=>{
    console.log("Like is saved");
    console.log(doc);
}).pre('find', (next)=>{
    console.log("Retriving likes");
    next();
}).post('find', (docs)=>{
    console.log("Post find");
    console.log(docs);
});