import { NextFunction, Request, Response } from 'express';
import { IUser, User, Availability } from '../models/user';

const thresholdTime = 30;
const thresholdSpeed = 25;

enum JoggingTime {
    "Short (<30 min)" = 0,
    "Medium (30-60 min)" = 45,
    "Long (>60 min)" = 90
}

type Time = {
    [key in JoggingTime]: number;
}

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
                locationWeight, 
                timeWeight = 0.3, 
                speedWeight,
                availabilityWeight = 0.1,
            } = req.body;

            console.log("lw", locationWeight);
            console.log("tw", timeWeight);
            console.log("sw", speedWeight);
            console.log("aw", availabilityWeight);

            const effectiveLocation = {
                latitude: user.latitude,
                longitude: user.longitude
            };
            const effectiveAvailability = user.availability;
            const effectiveSpeed = user.pace;

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
            next(error);
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
            next(error);
        }
    }

    private async findJogBuddies(
        currentUser: IUser, 
        userLocation: {
            latitude: string;
            longitude: string;
        }, 
        userAvailability: {
            monday: boolean;
            tuesday: boolean;
            wednesday: boolean;
            thursday: boolean;
            friday: boolean;
            saturday: boolean;
            sunday: boolean;
        }, 
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

        const matches = allUsers.map(buddy => {
            const buddyLocation = {
                latitude: buddy.latitude,
                longitude: buddy.longitude
            };
            const buddyAvailability = buddy.availability;
            const buddySpeed = buddy.pace;
            const buddyTime = buddy.time;
            
            const distanceScore = this.calculateDistance(userLocation, buddyLocation);
            const speedDifference = Math.min(Math.abs(userSpeed - buddySpeed), thresholdSpeed);
            
            const commonAvailability = this.calculateAvailabilityScore(userAvailability, buddyAvailability);

            // Calculate time difference using the time map
            const userTimeValue = JoggingTime[currentUser.time as keyof typeof JoggingTime];            
            const buddyTimeValue = JoggingTime[buddyTime as keyof typeof JoggingTime];
            const timeDifference = Math.min(Math.abs(userTimeValue - buddyTimeValue), thresholdTime);

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
                matchScore
            };
        })
        .filter(match => match !== null)
        .sort((a, b) => (b.matchScore) - (a.matchScore))
        .slice(0, 5);

        return matches;
    }

    private calculateAvailabilityScore(
        userAvailability: Availability, 
        buddyAvailability: Availability
    ): number {
        let totalDays = 7;
    
        let commonDays: number = Object.entries(userAvailability).filter(([day, value]) => value && buddyAvailability[day as keyof Availability]).length;
    
        return commonDays / totalDays;
    }

    private calculateDistance(location1: {
        latitude: string, 
        longitude: string
    }, location2: {
        latitude: string, 
        longitude: string
    }): number {
        const R = 6371;
        const dLat = this.toRadians(Number(location2.latitude) - Number(location1.latitude));
        const dLon = this.toRadians(Number(location2.longitude) - Number(location1.longitude));
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(Number(location1.latitude))) * 
            Math.cos(this.toRadians(Number(location2.latitude))) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
            
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}