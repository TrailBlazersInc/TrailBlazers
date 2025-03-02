import express, {NextFunction, Request, Response} from 'express';
import {client} from './services';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import { authMiddleware } from './middleware/authMiddleware';
import { MessagingRoutes } from './routes/MessagingRoutes';
import { AuthRoutes } from './routes/authRoutes';
import { UserRoutes } from './routes/UserRoutes';
import { RecommendationRoutes } from './routes/RecommendationRoutes';

dotenv.config();

const app = express()
app.use(express.json())
app.use(morgan('tiny'))

const Routes = [...MessagingRoutes, ...AuthRoutes, ...UserRoutes, ...RecommendationRoutes]

//const publicRoutes = ["/api/v1/auth/google"];

Routes.forEach( (route) => {

    //const middlewares = publicRoutes.includes(route.route) ? [] : [authMiddleware];

    (app as any) [route.method](
        route.route,
        //...middlewares,
        route.validation,
        async (req: Request, res: Response, next: NextFunction) => {
            const errors = validationResult(req)

            if (!errors.isEmpty()){
                res.status(400).send({errors: errors.array()})
            }

            try {
                await route.action(
                    req,
                    res,
                    next,
                )
            } catch (error) {
                console.log(error)
                res.status(500)
            }
        }
    )
})

app.get('/', async (req: Request, res: Response) =>{
    res.status(200).send('hello')
})

client.connect().then(() => {
    console.log("Mongo DB Client Connected")
}).catch(err =>{
    console.error(err)
    client.close()
})

mongoose.connect('mongodb://127.0.0.1/gettingstarted').then(() =>{
    console.log("Mongo DB Models Connected");
}).catch(err =>{
    console.error(err)
    client.close()
})

app.listen(process.env.PORT, () => {
    console.log("Listening on port " + process.env.PORT)
})
