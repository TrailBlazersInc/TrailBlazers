import { Request, Response } from 'express';
import { UserController } from '../controllers/UserControllers';
import { param } from 'express-validator';

const controller = new UserController();

export const UserRoutes = [
    {
        method: 'get',
        route: '/User/:email',
        action: (req: Request, res: Response) => controller.getUserData(req, res),
        validation: [
            param("email").isEmail()
        ]
    },
    {
        method: 'put',
        route: '/User/:email',
        action: (req: Request, res: Response) => controller.putUserData(req, res),
        validation: [
            param("email").isEmail()
        ]
    }
];