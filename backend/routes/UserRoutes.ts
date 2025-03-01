import { UserController } from '../controllers/UserControllers';
import { body, param } from 'express-validator';

const controller = new UserController();

export const UserRoutes = [
    {
        method: 'get',
        route: '/User/:email',
        action: controller.getUserData,
        validation: [
            param("email").isEmail()
        ]
    },
    {
        method: 'put',
        route: '/User/:email',
        action: controller.putUserData,
        validation: [
            param("email").isEmail()
        ]
    }
];