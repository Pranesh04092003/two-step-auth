const mongoose =require ("mongoose");
const dotenv = require ("dotenv");

//To fetch the env file from our project we use --->  `dotenv.config()`
dotenv.config();

const connectDB=async()=>{
  try{
    await mongoose.connect(
      process.env.MONGODB_URL  //env filepath fetch
    );
    console.log("Connected to mongodb..");
  }
  catch(error){
      console.log(error.message);
      
  };
}




module.exports= connectDB;