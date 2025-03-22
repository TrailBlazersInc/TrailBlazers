import { RecommendationController } from "../controllers/RecommendationController";
import { param, body } from 'express-validator';

const controllers = new RecommendationController()

export const RecommendationRoutes = [
    {
        method: "post",
        route: "/recommendations/:email",
        action: controllers.postRecommendations,
        validation: [
            param("email").isEmail(),
            body("locationWeight").isFloat({ min: 0, max: 10 }).withMessage("locationWeight be a number between 0 and 10").toFloat(),
            body("speedWeight").isFloat({ min: 0, max: 10 }).withMessage("speedWeight be a number between 0 and 10").toFloat(),
            body("distanceWeight").isFloat({ min: 0, max: 10 }).withMessage("distanceWeight be a number between 0 and 10").toFloat()
        ]
    },
    {
        method: "post",
        route: "/api/users/location/:email",
        action: controllers.postLocation,
        validation: [
            param("email").isEmail(),
            body("latitude").isFloat({ min: -90, max: 90 }).withMessage("latitude must be a number between -90 and 90").toFloat(),
            body("longitude").isFloat({ min: -180, max: 180 }).withMessage("latitude must be a number between -180 and 180").toFloat()
        ]
    }
]