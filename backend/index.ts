import express, { NextFunction, Request, Response } from "express";
import { ConnectMongoDB } from "./services";
import morgan from "morgan";
import dotenv from "dotenv";
import http from "http";
import https from "https";
import fs from "fs";
import { validationResult } from "express-validator";
import { authMiddleware } from "./middleware/authMiddleware";
import { MessagingRoutes } from "./routes/MessagingRoutes";
import { AuthRoutes } from "./routes/authRoutes";
import { UserRoutes } from "./routes/UserRoutes";
import { RecommendationRoutes } from "./routes/RecommendationRoutes";
import { ReportRoutes } from "./routes/ReportRoutes";
import { BanRoutes } from "./routes/BanRoutes";

dotenv.config();

export const app = express();
app.use(express.json());
app.use(morgan("tiny"));

const Routes = [
	...MessagingRoutes,
	...AuthRoutes,
	...UserRoutes,
	...RecommendationRoutes,
	...ReportRoutes,
	...BanRoutes,
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

export const server = http.createServer(app);

async function startServer() {
	try {
		await ConnectMongoDB();
        const port = process.env.PORT ?? 3000; 
		if (require.main === module) {
			if (port == "443") {
				const options = {
					key: fs.readFileSync("/certs/privkey.pem"),
					cert: fs.readFileSync("/certs/fullchain.pem"),
				};
				https.createServer(options, app).listen(process.env.PORT, () => {
					console.log("Mongo DB Connected");
					console.log("Listening on port 443");
				});
			} else {
				app.listen([port], () => {
					console.log("Mongo DB Connected");
					console.log("Listening on port 3000");
				});
			}
		}
	} catch (error) {
		console.log("error starting server");
	}
}

void startServer();
