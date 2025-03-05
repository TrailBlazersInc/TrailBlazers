import { BanController } from "../controllers/BanControllers";
import { body, param } from 'express-validator';

const controllers = new BanController();

export const BanRoutes = [
    {
        method: "put",
        route: "/ban/:email",
        action: controllers.banUser,
        validation: [
            param("email").isEmail()
        ]
    },
    {
        method: "post",
        route: "/unban",
        action: controllers.unbanUser,
        validation: [
            body("userId").isString()
        ]
    }
];