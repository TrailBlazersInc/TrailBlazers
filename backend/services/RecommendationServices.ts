interface UserPreferences {
    locationWeight: number;
    speedWeight: number;
    distanceWeight: number;
    userLocation: { lat: number; lon: number };
    userTime: number;
    userSpeed: number;
}

interface Buddy {
    id: string;
    location: { lat: number; lon: number };
    time: number;
    speed: number;
}

const thresholdTime = 30; // Example threshold in minutes
const thresholdSpeed = 2; // Example threshold in km/h

export async function getShortlistedRecommendations(preferences: UserPreferences) {
    // Fetch buddies from database (mocked for now)
    const buddies: Buddy[] = await getBuddiesFromDB();

    let matches: { buddy: Buddy; matchScore: number }[] = [];

    for (const buddy of buddies) {
        const distanceScore = calculateDistance(preferences.userLocation, buddy.location);
        const timeDifference = Math.abs(preferences.userTime - buddy.time);
        const speedDifference = Math.abs(preferences.userSpeed - buddy.speed);

        if (timeDifference <= thresholdTime && speedDifference <= thresholdSpeed) {
            const matchScore =
                (1 / (1 + distanceScore)) * preferences.locationWeight +
                (1 / (1 + timeDifference)) * preferences.speedWeight +
                (1 / (1 + speedDifference)) * preferences.distanceWeight;

            matches.push({ buddy, matchScore });
        }
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches.slice(0, 5).map((match) => match.buddy);
}

function calculateDistance(location1: { lat: number; lon: number }, location2: { lat: number; lon: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(location2.lat - location1.lat);
    const dLon = toRadians(location2.lon - location1.lon);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(location1.lat)) * Math.cos(toRadians(location2.lat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// Mock function to fetch buddies from database
async function getBuddiesFromDB(): Promise<Buddy[]> {
    return [
        { id: "1", location: { lat: 49.2827, lon: -123.1207 }, time: 800, speed: 6 },
        { id: "2", location: { lat: 49.2500, lon: -123.1000 }, time: 900, speed: 5 },
        { id: "3", location: { lat: 49.3000, lon: -123.1500 }, time: 830, speed: 6.5 },
        { id: "4", location: { lat: 49.2800, lon: -123.1300 }, time: 815, speed: 5.8 },
        { id: "5", location: { lat: 49.2700, lon: -123.1100 }, time: 845, speed: 6.2 },
    ];
}
