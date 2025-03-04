import { ReportController } from "../controllers/ReportController";
import { body, param } from 'express-validator';

const controllers = new ReportController()

export const ReportRoutes = [
    {
        method: "post",
        route: "/report",
        action: controllers.postRecommendations,
        validation: [
            param("email").isEmail(),
            param("aggressor_email").isEmail()
        ]
    }
]