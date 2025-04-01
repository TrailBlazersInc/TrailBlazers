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

// Define custom interfaces for type safety
type UserPreferences = Record<string, string[]>;

type UserScores = Record<string, Record<string, number>>;

type UserProposals = Record<string, number>;

type UserMatches = Record<string, string | null>;

export class RecommendationController {
    postRecommendations = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userEmail = req.params.email;
            
            const user = await User.findOne({ email: userEmail });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const { locationWeight, speedWeight, distanceWeight, availabilityWeight } = req.body;

            const recommendation = await this.findJogBuddiesWithGaleShapley(
                user, 
                locationWeight, 
                distanceWeight, 
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
            const { latitude, longitude } = req.body;
            
            const user = await User.findOneAndUpdate(
                { email },
                { $set: { loc: { latitude, longitude } } },
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

        // Create arrays to store emails for validation
        const validUserEmails: string[] = [currentUser.email, ...allUsers.map(u => u.email)];
        
        const preferences: UserPreferences = {};
        const scores: UserScores = {};

        for (const userA of [currentUser, ...allUsers]) {
            scores[userA.email] = {};

            for (const userB of allUsers) {
                if (userA.email === userB.email) continue;

                const timeDifference = Math.min(
                    Math.abs(
                        JoggingTime[userA.time as keyof typeof JoggingTime] -
                        JoggingTime[userB.time as keyof typeof JoggingTime]
                    ),
                    thresholdTime
                );

                const locationScore = 1 / (1 + this.calculateDistance(userA.loc, userB.loc));
                const speedScore = 1 / (1 + Math.min(Math.abs(userA.pace - userB.pace), thresholdSpeed));
                const timeScore = 1 / (1 + timeDifference);
                const availabilityScore = this.calculateAvailabilityScore(userA.availability, userB.availability);

                scores[userA.email][userB.email] = Number(
                    (
                        (locationScore * weightLocation +
                            speedScore * weightSpeed +
                            timeScore * weightTime +
                            availabilityScore * weightAvailability) /
                        (weightLocation + weightSpeed + weightTime + weightAvailability) * 100
                    ).toPrecision(3)
                );
            }

            preferences[userA.email] = Object.entries(scores[userA.email])
                .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                .map(([email]) => email);
        }

        // Use Set with only valid emails to avoid injection
        const unmatchedSet = new Set<string>(validUserEmails);
        
        // Initialize with only valid keys from validUserEmails
        const proposals: UserProposals = {};
        const matches: UserMatches = {};
        
        // Safely initialize with only validated emails
        for (const email of validUserEmails) {
            proposals[email] = 0;
            matches[email] = null;
        }

        while (unmatchedSet.size > 0) {
            for (const proposer of Array.from(unmatchedSet)) {
                const preferred = preferences[proposer][proposals[proposer]];
                proposals[proposer]++; // Increment after accessing to avoid race conditions

                if (!matches[preferred]) {
                    matches[preferred] = proposer;
                    unmatchedSet.delete(proposer);
                } else {
                    const currentMatch = matches[preferred];
                    if (scores[preferred][proposer] > scores[preferred][currentMatch]) {
                        unmatchedSet.add(currentMatch);
                        matches[preferred] = proposer;
                        unmatchedSet.delete(proposer);
                    }
                }
            }
        }

        // Find matches for current user
        const matchResults = Object.entries(matches)
            .filter(([, user]) => user === currentUser.email)
            .map(([buddy]) => {
                const matchedUsers = allUsers.filter(u => u.email === buddy);                
                const matchedUser = matchedUsers[0];
                
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
            
        return matchResults[0];
    }

    private calculateAvailabilityScore(userAvailability: Availability, buddyAvailability: Availability): number {
        const totalDays = 7;
        const commonDays = Object.entries(userAvailability).filter(
            ([day, value]) => value && buddyAvailability[day as keyof Availability]
        ).length;
        return commonDays / totalDays;
    }

    private calculateDistance(location1: Location, location2: Location): number {
        const dLat = this.toRadians(location2.latitude - location1.latitude);
        const dLon = this.toRadians(location2.longitude - location1.longitude);
        
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(this.toRadians(location1.latitude)) *
                  Math.cos(this.toRadians(location2.latitude)) *
                  Math.sin(dLon / 2) ** 2;
        
        return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}