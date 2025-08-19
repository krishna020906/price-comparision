import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { dbName: 'demo' }).then(m =>{
        console.log("Successfully connected to MongoDB!"); // Add this line
        return m});
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const productCacheSchema = new mongoose.Schema({
  source:     { type: String, required: true },
  searchTerm: {
    type: String,
    required: true,
    trim: true,       // remove leading/trailing spaces
    lowercase: true   // convert to lowercase
  },
  products:   { type: Array,  required: true },
  updatedAt:  { type: Date,   default: Date.now, index: { expires: 30 * 24 * 60 * 60 } }
  // expires: 30 days in seconds
});

// Avoid recompilation errors in dev
const ProductCache = mongoose.models.ProductCache ||
                     mongoose.model('ProductCache', productCacheSchema);

export { ProductCache };