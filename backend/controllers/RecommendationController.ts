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

type UserPreferences = Map<string, string[]>;
type UserScores = Map<string, Map<string, number>>;
type UserProposals = Map<string, number>;
type UserMatches = Map<string, string | null>;

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

        // Use Maps instead of plain objects to prevent prototype pollution
        const preferences: UserPreferences = new Map();
        const scores: UserScores = new Map();

        // Calculate scores and preferences
        for (const userA of [currentUser, ...allUsers]) {
            const userAEmail = userA.email;
            scores.set(userAEmail, new Map());
            const userScores = scores.get(userAEmail);
            if (!userScores) {
                return null;
            }

            for (const userB of allUsers) {
                const userBEmail = userB.email;
                if (userAEmail === userBEmail) continue;

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

                userScores.set(userBEmail, Number(
                    (
                        (locationScore * weightLocation +
                            speedScore * weightSpeed +
                            timeScore * weightTime +
                            availabilityScore * weightAvailability) /
                        (weightLocation + weightSpeed + weightTime + weightAvailability) * 100
                    ).toPrecision(3)
                ));
            }

            // Sort preferences by score
            const userPrefs = Array.from(userScores.entries())
                .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                .map(([email]) => email);
            
            preferences.set(userAEmail, userPrefs);
        }

        // Initialize Gale-Shapley algorithm data structures
        const unmatched = new Set([currentUser.email, ...allUsers.map(u => u.email)]);
        const proposals: UserProposals = new Map(
            Array.from(unmatched).map(email => [email, 0])
        );
        const matches: UserMatches = new Map(
            Array.from(unmatched).map(user => [user, null])
        );

        // Run Gale-Shapley algorithm
        while (unmatched.size > 0) {
            for (const proposer of Array.from(unmatched)) {
                const proposerPrefs = preferences.get(proposer)!;
                if (!proposerPrefs) {
                    return null;
                }
                
                const proposalCount = proposals.get(proposer) || 0;
                if (proposalCount >= proposerPrefs.length) {
                    unmatched.delete(proposer);
                    continue;
                }

                // Get the next preferred partner
                const preferredIndex = Math.min(proposalCount, proposerPrefs.length - 1);
                const preferred = proposerPrefs[preferredIndex]; 
                proposals.set(proposer, proposalCount + 1);

                // Check if preferred is already matched
                const currentMatch = matches.get(preferred);
                
                if (!currentMatch) {
                    // If not matched, create match
                    matches.set(preferred, proposer);
                    unmatched.delete(proposer);
                } else {
                    // If already matched, check if new proposer is preferred
                    const preferredScores = scores.get(preferred);
                    if (preferredScores) {
                        const proposerScore = preferredScores.get(proposer) ?? 0;
                        const currentMatchScore = preferredScores.get(currentMatch) ?? 0;
                        
                        if (proposerScore > currentMatchScore) {
                            // If new proposer is preferred, update matches
                            unmatched.add(currentMatch);
                        }
                    }
                }
            }
        }

        // Find the match for current user
        const matchedBuddies = Array.from(matches.entries())
            .filter(([, user]) => user === currentUser.email)
            .map(([buddy]) => {
                const matchedUsers = allUsers.filter(u => u.email === buddy);                
                const matchedUser = matchedUsers[0];
                const currentUserScores = scores.get(currentUser.email);
                let matchScore = 0;
                if (currentUserScores) {
                    const score = currentUserScores.get(buddy);
                    if (score !== undefined) {
                        matchScore = score;
                    }
                }

                return {
                    email: matchedUser.email,
                    firstName: matchedUser.first_name,
                    lastName: matchedUser.last_name,
                    pace: matchedUser.pace,
                    distance: matchedUser.distance,
                    time: matchedUser.time,
                    availability: matchedUser.availability,
                    matchScore
                };
            })
            .filter(Boolean); // Remove null entries
            
        return matchedBuddies[0];
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