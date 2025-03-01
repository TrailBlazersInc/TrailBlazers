import { authenticate } from '../controllers/authControllers';
import { body } from 'express-validator';

const controller = new authenticate();

export const AuthRoutes = [
    {
        method: 'post',
        route: '/api/v1/auth/google',
        action: controller.authId,
        validation: []
    }
];