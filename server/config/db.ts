import mongoose from 'mongoose';

export let isConnectedToMongo = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('user:password@cluster')) {
    console.log('MongoDB Atlas URI not configured or using placeholder. Running on integrated persistent storage engine.');
    return false;
  }

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnectedToMongo = true;
    console.log('Successfully connected to MongoDB Atlas for Sadhukhan Varities.');
    return true;
  } catch (error) {
    console.warn('MongoDB Atlas connection failed or timed out. Falling back smoothly to integrated persistent storage:', (error as Error).message);
    isConnectedToMongo = false;
    return false;
  }
}
