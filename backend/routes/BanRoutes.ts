import { BanController } from "../controllers/BanControllers";
import { body, param } from 'express-validator';
import {Request, Response}  from 'express';

const controllers = new BanController();

export const BanRoutes = [
    {
        method: "put",
        route: "/ban/:email",
        action: (req: Request, res: Response) =>  controllers.banUser(req, res),
        validation: [
            param("email").isEmail()
        ]
    },
    {
        method: "post",
        route: "/unban",
        action: (req: Request, res: Response) =>  controllers.unbanUser(req, res),
        validation: [
            body("userId").isString()
        ]
    }
];