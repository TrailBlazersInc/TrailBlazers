import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user';
import jwt from 'jsonwebtoken';

export class RecommendationController {
    // Using arrow function to preserve 'this' context
    postRecommendations = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Extract token from the Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: "Unauthorized" });
            }
    
            const token = authHeader.split(" ")[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
            const userEmail = req.params.email;
    
            // Fetch user data from DB
            const user = await User.findOne({ email: userEmail });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
    
            // Extract weights from request body or use default values
            const { 
                locationWeight = 0.4, 
                timeWeight = 0.3, 
                speedWeight = 0.3, 
                userLocation, 
                userAvailability, 
                userSpeed 
            } = req.body;
    
            // Use user's stored preferences if not provided in request
            const effectiveLocation = userLocation || user.location;
            const effectiveAvailability = userAvailability || user.time;
            const effectiveSpeed = userSpeed !== undefined ? userSpeed : user.pace;
    
            // Define thresholds
            const thresholdTime = 30; // 30 minutes difference in availability
            const thresholdSpeed = 2; // 2 pace units difference
    
            const recommendations = await this.findJogBuddies(
                user, 
                effectiveLocation, 
                effectiveAvailability, 
                effectiveSpeed,
                locationWeight, 
                timeWeight, 
                speedWeight, 
                thresholdTime, 
                thresholdSpeed
            );
    
            res.status(200).json({ status: 'success', recommendations });
        } catch (error) {
            console.error("Error processing recommendations:", error);
            res.status(500).json({ status: 'error', error: 'Failed to process recommendations' });
        }
    }

    private async findJogBuddies(
        currentUser: any, 
        userLocation: any, 
        userAvailability: string, 
        userSpeed: number,
        weightLocation: number,
        weightTime: number,
        weightSpeed: number,
        thresholdTime: number,
        thresholdSpeed: number
    ) {
        // Fetch all potential jogging buddies from the DB
        const allUsers = await User.find({
            email: { $ne: currentUser.email }, // Exclude the current user
            banned: { $ne: true }             // Exclude banned users
        });

        // Map availability strings to numeric values for comparison
        const availabilityMap: { [key: string]: number } = {
            "Short (<30 min)": 15,
            "Medium (30-60 min)": 45,
            "Long (>60 min)": 90
        };

        // Convert distance strings to numeric values for comparison
        const distanceMap: { [key: string]: number } = {
            "Short (<5 km)": 3,
            "Medium (5-10 km)": 7.5,
            "Long (>10 km)": 15
        };

        // Convert user's availability to numeric value
        const userAvailabilityValue = availabilityMap[userAvailability] || 45; // Default to medium

        const matches = allUsers.map(buddy => {
            // Handle potential missing data gracefully
            const buddyLocation = buddy.location || { latitude: 0, longitude: 0 };
            const buddyAvailabilityValue = availabilityMap[buddy.time] || 45;
            const buddySpeed = buddy.pace || 5;

            // Calculate scores
            const distanceScore = userLocation ? this.calculateDistance(userLocation, buddyLocation) : 0;
            const timeDifference = Math.abs(userAvailabilityValue - buddyAvailabilityValue);
            const speedDifference = Math.abs(userSpeed - buddySpeed);

            // Only include matches within thresholds
            if (timeDifference <= thresholdTime && speedDifference <= thresholdSpeed) {
                // Calculate weighted score according to the algorithm
                const locationScore = 1 / (1 + distanceScore);
                const timeScore = 1 / (1 + timeDifference);
                const speedScore = 1 / (1 + speedDifference);

                const matchScore = 
                    (locationScore * weightLocation) + 
                    (timeScore * weightTime) + 
                    (speedScore * weightSpeed);

                return {
                    email: buddy.email,
                    firstName: buddy.first_name,
                    lastName: buddy.last_name,
                    pace: buddy.pace,
                    distance: buddy.distance,
                    time: buddy.time,
                    matchScore: matchScore
                };
            }
            return null;
        })
        .filter(match => match !== null) // Remove null entries
        .sort((a, b) => (b?.matchScore || 0) - (a?.matchScore || 0)) // Sort by match score (descending)
        .slice(0, 5); // Return top 5

        return matches;
    }

    private calculateDistance(location1: any, location2: any): number {
        // If locations are missing, return a large distance
        if (!location1 || !location2 || 
            location1.latitude === undefined || location1.longitude === undefined ||
            location2.latitude === undefined || location2.longitude === undefined) {
            return 999; // Large value to indicate poor match
        }

        // Implementation of Haversine formula for accurate Earth distance
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(location2.latitude - location1.latitude);
        const dLon = this.toRadians(location2.longitude - location1.longitude);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(location1.latitude)) * 
            Math.cos(this.toRadians(location2.latitude)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
            
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}