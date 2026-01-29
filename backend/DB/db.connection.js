import mongoose from 'mongoose';


export const dbConnection = async () => {
try 
{
    // Connect to the MongoDB database in 30 seconds by default
    await mongoose.connect(process.env.DB_URL_LOCAL,{serverSelectionTimeoutMS: 30000});
                                                                   
    
console.log('Database connected successfully');
}

catch (error)

{
    console.error('Error connecting to the database:', error);
    throw new Error('Database connection failed');
}
}

export default dbConnection; 