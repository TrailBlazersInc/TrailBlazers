import { Request, Response } from 'express';
import { Authenticate } from '../controllers/authControllers';
import { body } from 'express-validator';

const controller = new Authenticate();

export const AuthRoutes = [
    {
        method: 'post',
        route: '/api/v1/auth/google',
        action: (req: Request, res: Response) => controller.authId(req, res),
        validation: []
    }
];