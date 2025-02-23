import { MessagingControllers } from "../controllers/MessagingControllers"

const controllers = new MessagingControllers()

export const MessagingRoutes = [
    {
        method: "get",
        route: "/chats",
        action: controllers.getChats,
        validation: []
    }
]