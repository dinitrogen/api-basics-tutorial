import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import models, { connectDb } from './models';
import routes from './routes';
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Example custom middleware, assigns a user property to the request object
app.use(async (req, res, next) => {
    req.context = {
        models,
        me: await models.User.findByLogin('noshowdon'),
    };
    next();
});

// Mount the routes as middleware
app.use('/session', routes.session);
app.use('/users', routes.user);
app.use('/messages', routes.message);

app.get('*', function(req, res, next) {
    const error = new Error(
        `${req.ip} tried to access ${req.originalUrl}`,
    );

    error.statusCode = 301;

    next(error);
});

app.use((error, req, res, next) => {
    if (!error.statusCode) error.statusCode = 500;

    if (error.statusCode === 301) {
        return res.status(301).redirect('/not-found');
    }
    
    return res
        .status(error.statusCode)
        .json({ error: error.toString() });
});

const eraseDatabaseOnSync = true;

connectDb().then(async () => {
    if (eraseDatabaseOnSync) {
        await Promise.all([
            models.User.deleteMany({}),
            models.Message.deleteMany({}),
        ]);

        createUsersWithMessages();
    }

    app.listen(process.env.PORT, () =>
        console.log(`Example app listening on port ${process.env.PORT}!`),
    );
});

// Seeding the database with a few users/messages
const createUsersWithMessages = async () => {
    const user1 = new models.User({
        username: 'noshowdon',
    }); 

    const user2 = new models.User({
        username: 'dinitrogen',
    }); 

    const message1 = new models.Message({
        text: 'Hello world!',
        user: user1.id,
    });

    const message2 = new models.Message({
        text: 'Good to be here',
        user: user2.id,
    });
    
    const message3 = new models.Message({
        text: 'How are you?',
        user: user2.id,
    });

    await message1.save();
    await message2.save();
    await message3.save();

    await user1.save();
    await user2.save();
};
