import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import { server, ioServer } from '../..'; // Adjust the path as necessary
import { User } from '../../models/user'; // User model
import mongoose from 'mongoose';

const validEmail = "mockUser@example.com";

beforeEach(() => {
    jest.resetAllMocks();
});

afterAll(async () => {
    await mongoose.connection.close();
    server.close();
    await ioServer.close();
});

describe("Mocked: POST /recommendation/:email", () => {
    test("Database throws error while getting recommendations", async () => {
        jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
            throw new Error("Forced error while finding user");
        });

        const res = await request(server)
            .post(`/recommendations/${validEmail}`)
            .send({
                locationWeight: 5,
                speedWeight: 6,
                distanceWeight: 7,
                availabilityWeight: 4,
            });

        expect(res.status).toStrictEqual(500);
        expect(res.body).toHaveProperty("error", "Failed to process recommendations");
    });
});

describe("Mocked: POST /api/users/location/:email", () => {
    test("Failed to update user location (database error)", async () => {
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
