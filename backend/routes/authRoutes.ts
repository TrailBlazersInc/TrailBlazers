import { Request, Response } from 'express';
import { Authenticate } from '../controllers/authControllers';

const controller = new Authenticate();

export const AuthRoutes = [
    {
        method: 'post',
        route: '/api/v1/auth/google',
        action: (req: Request, res: Response) => controller.authId(req, res),
        validation: []
    }
];