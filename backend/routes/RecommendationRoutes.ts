import { RecommendationController } from "../controllers/RecommendationController"

const controllers = new RecommendationController()

export const MessagingRoutes = [
    {
        method: "post",
        route: "/recommendations",
        action: controllers.postRecommendations,
        validation: []
    }
]