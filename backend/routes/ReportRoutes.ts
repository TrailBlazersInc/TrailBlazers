import { ReportController } from "../controllers/ReportControllers";
import { body, param } from 'express-validator';
import {Request, Response} from 'express';
import mongoose from "mongoose";

const controllers = new ReportController()

export const ReportRoutes = [
    {
        method: "get",
        route: "/report",
        action: (req: Request, res: Response) => controllers.getReports(req, res),
        validation: []
    },
    {
        method: "post",
        route: "/report/:email",
        action: (req: Request, res: Response) => controllers.postReport(req, res),
        validation: [
            param("email").isEmail(),
            body("aggressor_email").isEmail(),
            body("description").isString()
        ]
    }
]