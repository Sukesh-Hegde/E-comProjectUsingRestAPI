import { ObjectId } from "mongodb";
import { getDB } from "../../config/mongodb.js";
import { ApplicationError } from "../../error-handler/applicationError.js";
import mongoose from "mongoose";
import { productSchema } from "./product.schema.js";
import { reviewSchema } from "./review.schema.js";
import { categorySchema } from "./category.schema.js";

// create the models for product and repository
const ProductModel = mongoose.model("Product", productSchema);
const ReviewModel = mongoose.model("Review", reviewSchema);
const CategoryModel = mongoose.model("Category", categorySchema);

class ProductRepository {
  constructor() {
    this.collection = "products";
  }

  async add(productData) {
    try {
      // 1. Adding Product
      productData.categories = productData.category.split(",");
      // console.log(productData);
      const newProduct = new ProductModel(productData);
      const savedProduct = await newProduct.save();

      // 2. Update categories.
      await CategoryModel.updateMany(
        { _id: { $in: productData.categories } }, //$in will work with array
        { $push: { products: new ObjectId(savedProduct._id) } } //what we need to update
      );
    } catch (err) {
      console.log(err);
      throw new ApplicationError("Something went wrong with database", 500);
    }
  }

  async getAll() {
    try {
      // 1. Get the database
      const db = getDB();
      // 2. Get the collection
      const collection = db.collection(this.collection);

      // 3. Find the document.
      return await collection.find().toArray();
    } catch (err) {
      console.log(err);
      throw new ApplicationError("Something went wrong with database", 500);
    }
  }

  async get(id) {
    try {
      // 1. Get the database
      const db = getDB();
      // 2. Get the collection
      const collection = db.collection(this.collection);

      // 3. Find the document.
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (err) {
      console.log(err);
      throw new ApplicationError("Something went wrong with database", 500);
    }
  }

  //using minPrice, maxPrice, category
  // async filter(minPrice, maxPrice, category){
  //     try{
  //       const db = getDB();
  //       const collection = db.collection(this.collection);
  //       let filterExpression = {};
  //       if(minPrice){
  //         filterExpression.price = {$gte: parseFloat(minPrice)}//mongoDB operator: gte=grater than equal to
  //       }
  //       if(maxPrice){
  //         filterExpression.price = {...filterExpression.price, $lte: parseFloat(maxPrice)} //...filterExpression.price it avoid over-writing, it will extend the result
  //       }
  //       if(category){
  //         filterExpression.category=category;
  //         }
  //       return await collection.find(filterExpression).toArray();// toArray=we are expecting to retuen more then one array
  //     } catch(err){
  //         console.log(err);
  //         throw new ApplicationError("Something went wrong with database", 500);
  //     }
  // }

  // Product should have min price specified and category
  async filter(minPrice, categories) {
    try {
      const db = getDB();
      const collection = db.collection(this.collection);
      let filterExpression = {};
      if (minPrice) {
        filterExpression.price = { $gte: parseFloat(minPrice) };
      }
      categories = JSON.parse(categories.replace(/'/g, '"'));
      if (categories) {
        filterExpression = {
          $or: [{ category: { $in: categories } }, filterExpression],
        };
        // filterExpression.category=category
      }
      return collection.find(filterExpression).toArray();
    } catch (err) {
      console.log(err);
      throw new ApplicationError("Something went wrong with database", 500);
    }
  }

  // async rate(userID, productID, rating){
  //     try{
  //         const db = getDB();
  //         const collection = db.collection(this.collection);
  //         // 1. Find the product
  //         const product = await collection.findOne({_id:new ObjectId(productID)})
  //         // 2. Find the rating

  //         const userRating = await product?.ratings?.find(r=>r.userID==userID);
  //         if(userRating){
  //         // 3. Update the rating
  //         await collection.updateOne({
  //             _id: new ObjectId(productID), "ratings.userID": new ObjectId(userID)
  //         },{
  //             $set:{
  //                 "ratings.$.rating":rating
  //             }
  //         }
  //         );
  //         }else{
  //             await collection.updateOne({
  //                 _id:new ObjectId(productID)
  //             },{
  //                 $push: {ratings: {userID:new ObjectId(userID), rating}}
  //             })
  //         }
  //     }catch(err){
  //         console.log(err);
  //         throw new ApplicationError("Something went wrong with database", 500);
  //     }
  // }

  async rate(userID, productID, rating) {
    try {
      // console.log(userID, productID, rating);
      // 1. Check if product exists
      const productToUpdate = await ProductModel.findById(productID);
      if (!productToUpdate) {
        throw new Error("Product not found");
      }

      // Find the existing review
      const userReview = await ReviewModel.findOne({
        product: new ObjectId(productID),
        user: new ObjectId(userID),
      });
      //updating review
      if (userReview) {
        userReview.rating = rating;
        await userReview.save();
      } else {
        const newReview = new ReviewModel({
          product: new ObjectId(productID),
          user: new ObjectId(userID),
          rating: rating,
        });
        newReview.save();
      }
    } catch (err) {
      console.log(err);
      throw new ApplicationError("Something went wrong with database", 500);
    }
  }

  async averageProductPricePerCategory() {
    try {
      const db = getDB();
      return await db
        .collection(this.collection)
        .aggregate([
          {
            // Stage 1: Get avaerge price per category
            $group: {
              _id: "$category",
              averagePrice: { $avg: "$price" },
            },
          },
        ])
        .toArray();
    } catch (err) {
      console.log(err);
      throw new ApplicationError("Something went wrong with database", 500);
    }
  }
}
export default ProductRepository;
