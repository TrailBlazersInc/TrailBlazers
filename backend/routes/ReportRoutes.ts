import { ReportController } from "../controllers/ReportControllers";
import { body, param } from 'express-validator';

const controllers = new ReportController()

export const ReportRoutes = [
    {
        method: "get",
        route: "/report",
        action: controllers.getReports,
        validation: []
    },
    {
        method: "post",
        route: "/report/:email",
        action: controllers.postReport,
        validation: [
            param("email").isEmail(),
            body("aggressor_email").isEmail(),
            body("description").isString()
        ]
    }
]