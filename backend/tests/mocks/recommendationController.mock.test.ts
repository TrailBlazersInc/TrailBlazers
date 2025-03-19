import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import { server } from '../..'; // Adjust the path as necessary
import { User } from '../../models/user'; // User model
import mongoose from 'mongoose';

const validEmail = "mockUser@example.com";

beforeEach(() => {
    jest.resetAllMocks();
});

afterAll(async () => {
    // Ensure that mongoose disconnects properly
    await mongoose.connection.close();
    server.close();
});

describe("Mocked: POST /recommendation/:email", () => {
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
