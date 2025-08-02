import mongoose from 'mongoose';

const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/my-app';

export async function connectDB() {
    try {
        await mongoose.connect(DB_URL);
        console.log('[db] MongoDB 连接成功');
    } catch (err) {
        console.error('[db] MongoDB 连接失败:', err.message);
        process.exit(1);
    }
}