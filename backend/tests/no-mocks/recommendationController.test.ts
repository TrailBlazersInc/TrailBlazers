import { describe, expect, test } from '@jest/globals';
import request from 'supertest';
import { server, ioServer } from '../..';
import { User } from '../../models/user';
import mongoose from 'mongoose';

const validEmail = "mockUser@example.com";
const invalidEmail = "fakeMockUser@example.com";

beforeAll(async () => {
    // Insert test data for mockUser
    await User.create({
        email: validEmail,
        first_name: "Mock", 
        last_name: "User", 
        pace: 6, 
        distance: "10km",
        time: "1 hour",
        availability: {
          monday: true,
          tuesday: false,
          wednesday: true,
          thursday: false,
          friday: true,
          saturday: false,
          sunday: true,
        },
        longitude: "123.1234", 
        latitude: "12.1234", 
        banned: false, 
        admin: false, 
    });
});

afterAll(async () => {
    // Clean up test data for mockUser
    await User.deleteMany({ email: validEmail });
    await mongoose.connection.close()
    server.close()
    await ioServer.close()
});

describe("POST /recommendation/:email", () => {
    test("POST /recommendations/:email - Valid Request", async () => {
        // Input: Valid email and data
        // Expected status code: 200
        // Expected behavior: Should return status success and an array of recommendations
        // Expected output: { status: 'success', recommendations: [...] }

        const res = await request(server)
            .post(`/recommendations/${validEmail}`)
            .send({
                locationWeight: 5,
                speedWeight: 6,
                distanceWeight: 7,
            });

        expect(res.status).toStrictEqual(200);
        expect(res.body).toHaveProperty("status", "success");
        expect(Array.isArray(res.body.recommendations)).toBe(true);
    });

    test("POST /recommendations/:email - User Not Found", async () => {
        // Input: Invalid email
        // Expected status code: 404
        // Expected behavior: Should return an error message for user not found
        // Expected output: { error: "User not found" }

        const res = await request(server)
            .post(`/recommendations/${invalidEmail}`)
            .send({
                locationWeight: 5,
                speedWeight: 6,
                distanceWeight: 7, });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty("error", "User not found");
    });
});

describe("POST /api/users/location/:email", () => {
    test("POST /api/users/location/:email - Update Location", async () => {
        // Input: Valid email and valid location data (latitude and longitude)
        // Expected status code: 200
        // Expected behavior: Should successfully update the location and return a message
        // Expected output: { message: "Location updated successfully" }

        const res = await request(server)
            .post(`/api/users/location/${validEmail}`)
            .send({
                latitude: 49.2827,
                longitude: -123.1207,
            });

        expect(res.status).toStrictEqual(200);
        expect(res.body).toHaveProperty("message", "Location updated successfully");
    });

    test("POST /api/users/location/:email - No latitude and longitude", async () => {
        // Input: Valid email with no latitude and longitude
        // Expected status code: 400
        // Expected behavior: Should return an error message indicating missing latitude and longitude
        // Expected output: { error: "Latitude and longitude are required" }

        const res = await request(server)
            .post(`/api/users/location/${validEmail}`)
            .send({});

        expect(res.status).toStrictEqual(400);
        expect(res.body).toHaveProperty("errors", [{"location": "body", "msg": "latitude must be a number between -90 and 90", "path": "latitude", "type": "field"}, {"location": "body", "msg": "latitude must be a number between -180 and 180", "path": "longitude", "type": "field"}]);
    });

    test("POST /api/users/location/:email - User Not Found", async () => {
        // Input: Invalid email with valid latitude and longitude
        // Expected status code: 404
        // Expected behavior: Should return an error message for user not found
        // Expected output: { error: "User not found" }

        const res = await request(server)
            .post(`/api/users/location/${invalidEmail}`)
            .send({
                latitude: 49.2827,
                longitude: -123.1207,
            });

        expect(res.status).toStrictEqual(404);
        expect(res.body).toHaveProperty("error", "User not found");
    });
});
