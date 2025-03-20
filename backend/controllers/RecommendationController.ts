import { NextFunction, Request, Response } from 'express';
import { IUser, User, Availability, Location } from '../models/user';
import { earthRadiusKm } from '../utils/locationUtils';

const thresholdTime = 30;
const thresholdSpeed = 25;

enum JoggingTime {
    "Short (<30 min)" = 0,
    "Medium (30-60 min)" = 10,
    "Long (>60 min)" = 20
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

            const locationWeight =  req.body.locationWeight;
            const speedWeight = req.body.speedWeight;
            const timeWeight = req.body.distanceWeight;
            const availabilityWeight = 5;

            const effectiveLocation: Location = user.loc;
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
                availabilityWeight
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
            const latitude: number = req.body.latitude;
            const longitude: number = req.body.longitude;

            let loc: Location = {
                latitude,
                longitude
            }
    
            // Find and update user
            const user = await User.findOneAndUpdate(
                { email },
                { 
                    $set: { 
                        loc
                    } 
                },
                { new: true } // Return the updated document
            );
    
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
    
            res.status(200).json({ 
                message: "Location updated successfully", 
                location: user.loc 
            });
        } catch (error) {
            res.status(500).json({ error: "Failed to update location" });
            next(error);
        }
    }

    private async findJogBuddies(
        currentUser: IUser, 
        userLocation: Location, 
        userAvailability: Availability,
        userSpeed: number,
        weightLocation: number,
        weightTime: number,
        weightSpeed: number,
        weightAvailability: number
    ) {
        const allUsers = await User.find({
            email: { $ne: currentUser.email },
            banned: { $ne: true }
        });

        const matches = allUsers.map(buddy => {
            const buddyLocation: Location = buddy.loc;
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

            const totalWeight = weightAvailability + weightLocation + weightSpeed + weightTime

            const matchScore = 
                ((locationScore * weightLocation) + 
                (timeScore * weightTime) +
                (speedScore * weightSpeed) +
                (availabilityScore * weightAvailability)) / totalWeight * 100;

            return {
                email: buddy.email,
                firstName: buddy.first_name,
                lastName: buddy.last_name,
                pace: buddy.pace,
                distance: buddy.distance,
                time: buddy.time,
                availability: buddy.availability,
                matchScore: Number(matchScore.toPrecision(2))
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

    private calculateDistance(location1: Location, location2: Location): number {
        const dLat = this.toRadians(location2.latitude - location1.latitude);
        const dLon = this.toRadians(location2.longitude - location1.longitude);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(location1.latitude)) * 
            Math.cos(this.toRadians(location2.latitude)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
            
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return earthRadiusKm * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}