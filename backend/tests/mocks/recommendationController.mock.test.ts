import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import { server } from '../..'; // Adjust the path as necessary
import { User } from '../../models/user'; // User model
import { RecommendationController } from '../../controllers/RecommendationController'; // Adjust the path as necessary
import mongoose from 'mongoose';

const validEmail = "mockUser@example.com";
const invalidEmail = "fakeMockUser@example.com";

beforeEach(() => {
    jest.resetAllMocks();
});

afterAll(async () => {
    // Ensure that mongoose disconnects properly
    await mongoose.connection.close();
    await server.close();
});

describe("Mocked: POST /recommendation/:email", () => {
    test("Successfully getting recommendations", async () => {
        // Mocked behavior: User.findOne returns a valid user
        // Input: validEmail with the correct user data
        // Expected status code: 200
        // Expected behavior: Recommendations are returned for the user
        // Expected output: Response contains an array of recommendations, and the first recommendation should be from "buddy@example.com"

        jest.spyOn(User, 'findOne').mockResolvedValue({
            email: validEmail,
            location: { latitude: 49.2827, longitude: -123.1207 },
            availability: { monday: true, tuesday: true, wednesday: false, thursday: true, friday: false, saturday: true, sunday: false },
            pace: 6,
            distance: "10km",
            time: "1 hour",
            first_name: "Mock",
            last_name: "User",
            banned: false,
            admin: false
        });

        jest.spyOn(User, 'find').mockResolvedValue([
            {
                email: 'buddy@example.com',
                first_name: 'John',
                last_name: 'Doe',
                pace: 6,
                distance: '10km',
                time: '1 hour',
                availability: { monday: true, tuesday: true },
            }
        ]);

        const res = await request(server)
            .post(`/recommendations/${validEmail}`)
            .send({
                locationWeight: 5,
                speedWeight: 6,
                distanceWeight: 7,
            });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("status", "success");
        expect(Array.isArray(res.body.recommendations)).toBe(true);
        expect(res.body.recommendations.length).toBe(1);
        expect(res.body.recommendations[0]).toHaveProperty("email", "buddy@example.com");

        expect(User.find).toHaveBeenCalledTimes(1);
    });

    test("User not found", async () => {
        // Mocked behavior: User.findOne returns null (no user found)
        // Input: invalidEmail
        // Expected status code: 404
        // Expected behavior: Should return error response with message "User not found"
        // Expected output: Error response with status 404 and error message "User not found"

        jest.spyOn(User, 'findOne').mockResolvedValue(null);

        const res = await request(server)
            .post(`/recommendations/${invalidEmail}`)
            .send({
                locationWeight: 5,
                speedWeight: 6,
                distanceWeight: 7,
            });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty("error", "User not found");
    });

    test("Database throws error while getting recommendations", async () => {
        // Mocked behavior: User.findOne throws an error
        // Input: validEmail with valid weights for recommendations
        // Expected status code: 500
        // Expected behavior: Should return error response due to database failure
        // Expected output: Error response with status 500 and error message "Failed to process recommendations"

        jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
            throw new Error("Forced error while finding user");
        });

        const res = await request(server)
            .post(`/recommendations/${validEmail}`)
            .send({
                locationWeight: 5,
                speedWeight: 6,
                distanceWeight: 7,
            });

        expect(res.status).toStrictEqual(500);
        expect(res.body).toHaveProperty("error", "Failed to process recommendations");
    });
});

describe("Mocked: POST /api/users/location/:email", () => {
    test("Successfully updating user location", async () => {
        // Mocked behavior: User.findOne returns a valid user and User.findOneAndUpdate updates the location
        // Input: validEmail with valid latitude and longitude for the location update
        // Expected status code: 200
        // Expected behavior: Location is successfully updated in the database
        // Expected output: Response contains success message and updated location

        jest.spyOn(User, 'findOne').mockResolvedValue({
            email: validEmail,
            location: { latitude: 49.2827, longitude: -123.1207 },
            availability: { monday: true, tuesday: true, wednesday: false, thursday: true, friday: false, saturday: true, sunday: false },
            pace: 6,
            distance: "10km",
            time: "1 hour",
            first_name: "Mock",
            last_name: "User",
            banned: false,
            admin: false
        });

        jest.spyOn(User, 'findOneAndUpdate').mockResolvedValue({
            email: validEmail,
            location: { latitude: 51.5074, longitude: -0.1278 },  // New location for mock
            availability: { monday: true, tuesday: true, wednesday: false, thursday: true, friday: false, saturday: true, sunday: false },
            pace: 6,
            distance: "10km",
            time: "1 hour",
            first_name: "Mock",
            last_name: "User",
            banned: false,
            admin: false
        });

        const res = await request(server)
            .post(`/api/users/location/${validEmail}`)
            .send({
                latitude: 51.5074,
                longitude: -0.1278,
            });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message", "Location updated successfully");
        expect(res.body.location).toEqual({ latitude: 51.5074, longitude: -0.1278 });

        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
            { email: validEmail },
            expect.objectContaining({
                "$set": {
                    "latitude": 51.5074, 
                    "longitude": -0.1278
                }}),
            { new: true }
        );
    });

    test("User not found for location update", async () => {
        // Mocked behavior: User.findOne returns null (no user found)
        // Input: invalidEmail with latitude and longitude for the location update
        // Expected status code: 404
        // Expected behavior: Should return error response with message "User not found"
        // Expected output: Error response with status 404 and error message "User not found"

        jest.spyOn(User, 'findOne').mockResolvedValue(null);

        const res = await request(server)
            .post(`/api/users/location/${invalidEmail}`)
            .send({
                latitude: 51.5074,
                longitude: -0.1278,
            });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty("error", "User not found");
    });

    test("Failed to update user location (database error)", async () => {
        // Mocked behavior: User.findOneAndUpdate throws an error
        // Input: validEmail with latitude and longitude for the location update
        // Expected status code: 500
        // Expected behavior: Should return error response due to database failure
        // Expected output: Error response with status 500 and error message "Failed to update location"

        jest.spyOn(User, 'findOneAndUpdate').mockImplementationOnce(() => {
            throw new Error("Database error while updating location");
        });

        const res = await request(server)
            .post(`/api/users/location/${validEmail}`)
            .send({
                latitude: 51.5074,
                longitude: -0.1278,
            });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty("error", "Failed to update location");
    });
});
