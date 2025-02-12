import express, {NextFunction, Request, Response} from 'express'
import {client} from './services'
import morgan from 'morgan'
import { validationResult } from 'express-validator'
import { MessagingRoutes } from './routes/MessagingRoutes'

const app = express()
app.use(express.json())
app.use(morgan('tiny'))

const Routes = [...MessagingRoutes]

Routes.forEach( (route) => {
    (app as any) [route.method](
        route.route,
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

app.listen(process.env.PORT, () => {
    console.log("Listening on port " + process.env.PORT)
})
