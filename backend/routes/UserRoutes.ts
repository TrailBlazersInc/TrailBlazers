import { Request, Response } from 'express';
import { UserController } from '../controllers/UserControllers';
import { param, body } from 'express-validator';

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
    },
    {
        method: "put",
        route: "/ban/:email",
        action: (req: Request, res: Response) =>  controller.banUser(req, res),
        validation: [
            param("email").isEmail()
        ]
    },
    {
        method: "get",
        route: "/report",
        action: (req: Request, res: Response) => controller.getReports(req, res),
        validation: []
    },
    {
        method: "post",
        route: "/report/:email",
        action: (req: Request, res: Response) => controller.postReport(req, res),
        validation: [
            param("email").isEmail(),
            body("aggressor_email").isEmail(),
            body("description").isString()
        ]
    }
];