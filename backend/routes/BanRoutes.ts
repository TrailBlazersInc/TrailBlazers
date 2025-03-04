import { BanController } from "../controllers/BanControllers";
import { body, param } from 'express-validator';

const controllers = new BanController();

export const BanRoutes = [
    {
        method: "post",
        route: "/ban",
        action: controllers.banUser,
        validation: [
            body("userId").isString(),
            body("reason").isString()
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