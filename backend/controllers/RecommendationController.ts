import { NextFunction, Request, Response } from 'express';
import { IUser, User, Availability, Location } from '../models/user';
import { earthRadiusKm } from '../utils/locationUtils';

const thresholdTime = 30;
const thresholdSpeed = 25;

enum JoggingTime {
    "Short (<30 min)" = 0,
    "Medium (30–60 min)" = 10,
    "Long (>60 min)" = 20
}

export class RecommendationController {
    postRecommendations = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userEmail = req.params.email;
            
            const user = await User.findOne({ email: userEmail });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const locationWeight = req.body.locationWeight;
            const speedWeight = req.body.speedWeight;
            const timeWeight = req.body.distanceWeight;
            const availabilityWeight = req.body.availabilityWeight

            const recommendation = await this.findJogBuddiesWithGaleShapley(
                user, 
                locationWeight, 
                timeWeight, 
                speedWeight,
                availabilityWeight
            );

            res.status(200).json({ status: 'success', recommendation });
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

            let loc: Location = { latitude, longitude };
    
            const user = await User.findOneAndUpdate(
                { email },
                { $set: { loc } },
                { new: true }
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

    private findJogBuddiesWithGaleShapley = async(
        currentUser: IUser,
        weightLocation: number,
        weightTime: number,
        weightSpeed: number,
        weightAvailability: number
    ) => {
        const allUsers = await User.find({
            email: { $ne: currentUser.email },
            banned: { $ne: true }
        });

        const preferences: Record<string, string[]> = Object.create(null);
        const scores: Record<string, Record<string, number>> = Object.create(null);

        for (const userA of [currentUser, ...allUsers]) {
            preferences[userA.email] = [];
            scores[userA.email] = {};

            for (const userB of allUsers) {
                if (userA.email === userB.email) continue;

                // Calculate time difference using the time map
                const userTimeValue = JoggingTime[userA.time as keyof typeof JoggingTime];            
                const buddyTimeValue = JoggingTime[userB.time as keyof typeof JoggingTime];
                const timeDifference = Math.min(Math.abs(userTimeValue - buddyTimeValue), thresholdTime);

                const locationScore = 1 / (1 + this.calculateDistance(userA.loc, userB.loc));
                const speedScore = 1 / (1 + Math.min(Math.abs(userA.pace - userB.pace), thresholdSpeed));
                const timeScore = 1 / (1 + timeDifference);
                const availabilityScore =  this.calculateAvailabilityScore(userA.availability, userB.availability);

                const totalScore =
                    (locationScore * weightLocation +
                        speedScore * weightSpeed +
                        timeScore * weightTime) +
                        availabilityScore * weightAvailability /
                    (weightLocation + weightSpeed + weightTime) * 100;
                
                scores[userA.email][userB.email] = Number(totalScore.toPrecision(3));
            }
            const userScores = scores[userA.email] ?? {}; // Ensure scores exist
            preferences[userA.email] = Object.keys(userScores).sort((a, b) => (userScores[b] ?? 0) - (userScores[a] ?? 0));
        }

        const unmatched = new Set<string>([currentUser.email, ...allUsers.map(u => u.email)]);
        const proposals: Record<string, number> = Object.create(null);
        const matches: Record<string, string | null> = Object.create(null);

        for (const user of unmatched) {
            proposals[user] = 0;
            matches[user] = null;
        }

        while (unmatched.size > 0) {
            for (const proposer of Array.from(unmatched)) {
                const hasProposedToAll = proposals[proposer] >= preferences[proposer].length;
                if (hasProposedToAll) {
                    unmatched.delete(proposer);
                    continue;
                }

                const preferred = preferences[proposer][proposals[proposer]];
                proposals[proposer]++;

                if (!matches[preferred]) {
                    matches[preferred] = proposer;
                    unmatched.delete(proposer);
                } else {
                    const currentMatch = matches[preferred];
                    if (scores[preferred][proposer] > scores[preferred][currentMatch]) {
                        matches[preferred] = proposer;
                        unmatched.add(currentMatch);
                        unmatched.delete(proposer);
                    }
                }
            }
        }

        const bestMatchEntry = Object.entries(matches)
            .filter(([, user]) => user && user === currentUser.email)
            .map(([buddy]) => {
                const matchedUser = allUsers.find(u => u.email === buddy);
                if (!matchedUser) return null;
                return {
                    email: matchedUser.email,
                    firstName: matchedUser.first_name,
                    lastName: matchedUser.last_name,
                    pace: matchedUser.pace,
                    distance: matchedUser.distance,
                    time: matchedUser.time,
                    availability: matchedUser.availability,
                    matchScore: scores[currentUser.email][buddy]
                };
            })
            
        return bestMatchEntry[0]; // Select the best match
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