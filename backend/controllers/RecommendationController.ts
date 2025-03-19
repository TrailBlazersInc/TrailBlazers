import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user';
import jwt from 'jsonwebtoken';

export class RecommendationController {
    // Using arrow function to preserve 'this' context
    postRecommendations = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userEmail = req.params.email;
            
            const user = await User.findOne({ email: userEmail });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const { 
                locationWeight = 0.4, 
                timeWeight = 0.3, 
                speedWeight = 0.2,
                availabilityWeight = 0.1,
                userLocation, 
                userAvailability, 
                userSpeed 
            } = req.body;

            const effectiveLocation = userLocation || user.location;
            const effectiveAvailability = userAvailability || user.availability;
            const effectiveSpeed = userSpeed !== undefined ? userSpeed : user.pace;

            const thresholdTime = 30;
            const thresholdSpeed = 2;

            const recommendations = await this.findJogBuddies(
                user, 
                effectiveLocation, 
                effectiveAvailability, 
                effectiveSpeed,
                locationWeight, 
                timeWeight, 
                speedWeight,
                availabilityWeight,
                thresholdTime, 
                thresholdSpeed
            );

            res.status(200).json({ status: 'success', recommendations });
        } catch (error) {
            console.error("Error processing recommendations:", error);
            res.status(500).json({ status: 'error', error: 'Failed to process recommendations' });
        }
    }

    postLocation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.params;
            const { latitude, longitude } = req.body;
    
            // Validate input
            if (latitude === undefined || longitude === undefined) {
                return res.status(400).json({ error: "Latitude and longitude are required" });
            }
    
            // Find and update user
            const user = await User.findOneAndUpdate(
                { email },
                { 
                    $set: { 
                        latitude, 
                        longitude 
                    } 
                },
                { new: true } // Return the updated document
            );
    
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
    
            res.status(200).json({ 
                message: "Location updated successfully", 
                location: user.location 
            });
        } catch (error) {
            console.error("Error updating user location:", error);
            res.status(500).json({ error: "Failed to update location" });
        }
    }

    private async findJogBuddies(
        currentUser: any, 
        userLocation: any, 
        userAvailability: any, 
        userSpeed: number,
        weightLocation: number,
        weightTime: number,
        weightSpeed: number,
        weightAvailability: number,
        thresholdTime: number,
        thresholdSpeed: number
    ) {
        const allUsers = await User.find({
            email: { $ne: currentUser.email },
            banned: { $ne: true }
        });

        // Reintroduce the original mapping for distance and time
        const distanceMap: { [key: string]: number } = {
            "Short (<5 km)": 3,
            "Medium (5-10 km)": 7.5,
            "Long (>10 km)": 15,
            "Marathon (>15 km)": 20
        };

        const timeMap: { [key: string]: number } = {
            "Short (<30 min)": 15,
            "Medium (30-60 min)": 45,
            "Long (>60 min)": 90
        };

        const matches = allUsers.map(buddy => {
            const buddyLocation = buddy.location;
            const buddyAvailability = buddy.availability;
            const buddySpeed = buddy.pace || 5;
            const buddyTime = buddy.time || "Medium (30-60 min)";
            
            const distanceScore = userLocation ? this.calculateDistance(userLocation, buddyLocation) : 0;
            const speedDifference = Math.abs(userSpeed - buddySpeed);
            
            const commonAvailability = this.calculateAvailabilityScore(userAvailability, buddyAvailability);

            // Calculate time difference using the time map
            const userTimeValue = timeMap[currentUser.time] || 45;
            const buddyTimeValue = timeMap[buddyTime] || 45;
            const timeDifference = Math.abs(userTimeValue - buddyTimeValue);

            if (speedDifference <= thresholdSpeed && timeDifference <= thresholdTime) {
                const locationScore = 1 / (1 + distanceScore);
                const speedScore = 1 / (1 + speedDifference);
                const timeScore = 1 / (1 + timeDifference);
                const availabilityScore = commonAvailability;

                const matchScore = 
                    (locationScore * weightLocation) + 
                    (timeScore * weightTime) +
                    (speedScore * weightSpeed) +
                    (availabilityScore * weightAvailability);

                return {
                    email: buddy.email,
                    firstName: buddy.first_name,
                    lastName: buddy.last_name,
                    pace: buddy.pace,
                    distance: buddy.distance,
                    time: buddy.time,
                    availability: buddy.availability,
                    matchScore: matchScore
                };
            }
            return null;
        })
        .filter(match => match !== null)
        .sort((a, b) => (b.matchScore || 0) - (a?.matchScore || 0))
        .slice(0, 5);

        return matches;
    }

    private calculateAvailabilityScore(userAvailability: any, buddyAvailability: any): number {
        const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        let commonDays = 0;
        let totalDays = days.length;

        days.forEach(day => {
            if (userAvailability[day] && buddyAvailability[day]) {
                commonDays++;
            }
        });
        return commonDays / totalDays;
    }

    private calculateDistance(location1: any, location2: any): number {
        if (!location1 || !location2 || 
            location1.latitude === undefined || location1.longitude === undefined ||
            location2.latitude === undefined || location2.longitude === undefined) {
            return 999;
        }

        const R = 6371;
        const dLat = this.toRadians(location2.latitude - location1.latitude);
        const dLon = this.toRadians(location2.longitude - location1.longitude);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(location1.latitude)) * 
            Math.cos(this.toRadians(location2.latitude)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
            
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}