import { RecommendationController } from "../controllers/RecommendationController";
import { body, param } from 'express-validator';

const controllers = new RecommendationController()

export const RecommendationRoutes = [
    {
        method: "post",
        route: "/recommendations/:email",
        action: controllers.postRecommendations,
        validation: [
            param("email").isEmail()
        ]
    },
    {
        method: "post",
        route: "/api/users/location/:email",
        action: controllers.postLocation,
        validation: [
            param("email").isEmail()
        ]
    }
]