import express, { Request, Response, NextFunction } from "express";
import { ConnectMongoDB } from "./services";
import morgan from "morgan";
import dotenv from "dotenv";
import http from "http";
import https from "https";
import fs from "fs";
import setUpWebSocket from "./socket";
import { validationResult } from "express-validator";
import { authMiddleware } from "./middleware/authMiddleware";
import { MessagingRoutes } from "./routes/MessagingRoutes";
import { UserRoutes } from "./routes/UserRoutes";
import { RecommendationRoutes } from "./routes/RecommendationRoutes";
import {Server as SocketIOServer} from "socket.io";


dotenv.config();

export const app = express();
app.use(express.json());
app.use(morgan("dev"));
const Routes = [
	...MessagingRoutes,
	...UserRoutes,
	...RecommendationRoutes,
];

const publicRoutes = ["/api/v1/auth/google"];
const isTesting = process.env.IS_TESTING;

Routes.forEach((route) => {
	let middlewares: ((
		req: Request,
		res: Response,
		next: NextFunction
    ) => express.Response | undefined)[] = [];

	if (!isTesting) {
		middlewares = publicRoutes.includes(route.route) ? [] : [authMiddleware];
	}

	(app as any)[route.method](
		route.route,
		...middlewares,
		route.validation,
		async (req: Request, res: Response, next: NextFunction) => {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				res.status(400).send({ errors: errors.array() });
			}

			try {
				await route.action(req, res, next);
			} catch (error) {
				res.status(500);
			}
		}
	);
});

app.get("/", (req: Request, res: Response) => {
	res.status(200).send("hello");
});

(async() => {
	try{
		await ConnectMongoDB()
		console.log("Mongo DB Connected");
	} catch{
		console.log("Failed to connect to Mongo DB")
	}
})();


const port = process.env.PORT ?? 3000;
let appServer: http.Server | https.Server;

if (port == "443") {
	const options = {
		key: fs.readFileSync("/certs/privkey.pem"),
		cert: fs.readFileSync("/certs/fullchain.pem"),
	};
	const serverHTTPS = https.createServer(options, app);
	setUpWebSocket(serverHTTPS)
	
	serverHTTPS.listen(process.env.PORT, () => {
		console.log("Listening on port 443");
	});
	appServer = serverHTTPS;
} else {
	const serverHTTP = http.createServer(app);
	setUpWebSocket(serverHTTP)
	
	serverHTTP.listen(port, () => {
		console.log("Listening on port 3000");
	});
	appServer = serverHTTP;
}

let ioServer: SocketIOServer = setUpWebSocket(appServer);

export {appServer as server, ioServer}
