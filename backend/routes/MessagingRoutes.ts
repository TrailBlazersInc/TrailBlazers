import { MessagingControllers } from "../controllers/MessagingControllers"

const controllers = new MessagingControllers()

export const MessagingRoutes = [
    {
        method: "get",
        route: "/chat",
        action: controllers.getChat,
        validation: []
    }
]