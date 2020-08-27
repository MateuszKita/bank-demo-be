import {connect} from 'mongoose';

export const connectToMongo = async () => {
    const mongoUrl = process.env.MONGODB_URI;

    if (mongoUrl) {
        const maxRetryTimes = 10;
        const timeToRetry = 10000;

        let connectionRetries = 0;

        const options = {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
        };

        const connectWithRetry = async () => {
            console.log(connectionRetries === 0 ? 'Trying to connect to MongoDB' : 'Retrying to connect to MongoD');
            await connect(mongoUrl, options).then(() => {
                console.log('MongoDB is connected');
            }).catch((err) => {
                if (connectionRetries <= maxRetryTimes) {
                    console.error(`MongoDB connection unsuccessful, retry after ${timeToRetry / 1000} seconds.`, err);
                    connectionRetries++;
                    setTimeout(connectWithRetry, timeToRetry);
                } else {
                    console.error('Could not establish connection to MongoDB after 10 retries, giving up...', err);
                }
            });
        };

        await connectWithRetry();
    } else {
        console.error('Could not read MongoDB URL');
    }
};
