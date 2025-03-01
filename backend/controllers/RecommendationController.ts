import { NextFunction, Request, Response } from "express";
import { getShortlistedRecommendations } from "../services/RecommendationServices";

export class RecommendationController {
    postRecommendations = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { locationWeight, speedWeight, distanceWeight, userLocation, userTime, userSpeed } = req.body;

            if (!userLocation || !userTime || !userSpeed) {
                return res.status(400).json({ error: "Missing required parameters" });
            }

            const recommendations = await getShortlistedRecommendations({
                locationWeight,
                speedWeight,
                distanceWeight,
                userLocation,
                userTime,
                userSpeed,
            });

            return res.status(200).json({ recommendations });
        } catch (err) {
            console.error("Error getting recommendations: ", err);
            res.status(500).json({ error: "Internal Server Error" });
        }
    };
}
