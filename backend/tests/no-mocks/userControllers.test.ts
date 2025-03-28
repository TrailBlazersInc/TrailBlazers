import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { server, ioServer } from '../../index';
import { User } from '../../models/user';
import crypto from 'crypto';

const validEmail = crypto.randomUUID() + '@example.com';
const invalidEmail = "invalidmockUser@example.com";
const distance = '5km';
const time = '2 hour';
const pace = 5;
const aggressor_email = invalidEmail;
const description = "Harrassment";
const availability = {
    monday: true,
    tuesday: false,
    wednesday: true,
    thursday: false,
    friday: true,
    saturday: false,
    sunday: true,
  };

beforeAll(async () => {
    await User.create({
        social_id: 'mocked_user_id',
        email: validEmail,
        first_name: 'Mock', 
        last_name: 'User', 
        pace: 6, 
        distance: '10km',
        time: '1 hour',
        availability: {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        },
        longitude: '123.1234', 
        latitude: '12.1234', 
        banned: false, 
        admin: false, 
    });
});

afterAll(async () => {
    await User.deleteMany({email: validEmail})
    await User.deleteMany({social_id: "mocked_user_id"})
    await mongoose.connection.close();
    server.close();
    await ioServer.close();
});

describe('GET /user/:email', () => {
    test('Valid request', async () => {
        //Input: Valid Email
        //Expected Status Code: 200
        //Expected Behavior: Returns User Data
        //Expected output: User object
        const response = await request(server).get('/User/' + validEmail).send({});
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('user');
    });
});

describe('PUT /user/:email', () => {
    test('Valid request', async () => {
        //Input: Valid Email and updated preferences
        //Expected Status Code: 200
        //Expected Behavior: Updates the User DB of the user with updated preferences and returns success message
        //Expected output: Message 'User data updated successfully'
        const response = await request(server).put('/User/' + validEmail).send({ distance , time , pace , availability });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'User data updated successfully');
    });
    test('Invalid user email', async () => {
        //Input: Invalid Email
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Error 'User not found'
        const response = await request(server).put('/User/' + invalidEmail).send({ distance, time, pace, availability });
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('User not found');
    });
});

describe('POST /api/v1/auth/google', () => {
    test('No GoogleID provided', async () => {
        //Input: nothing
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Error 'ID is required'
        const response = await request(server).post('/api/v1/auth/google').send({});
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('ID is required');
    });
});

describe('PUT /ban/:email', () => {
    test('Invalid email provided', async () => {
        //Input: Invalid Email
        //Expected Status Code: 404
        //Expected Behavior: Returns Error Message
        //Expected output: Error 'User not found'
        const response = await request(server).put('/ban/' + invalidEmail).send({});
        expect(response.status).toBe(404);
        expect(response.body.error).toBe('User not found');
    });
    test('Valid request', async () => {
        //Input: Valid Email
        //Expected Status Code: 200
        //Expected Behavior: Updates the user associated with the email in the User DB to reflect banned status
        //Expected output: Message 'User banned'
        const response = await request(server).put('/ban/' + validEmail).send({});
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'User banned');
    });
});

describe('GET /report', () => {
    test('Valid Request', async () => {
        //Input: nothing
        //Expected Status Code: 200
        //Expected Behavior: Returns a object that contains all the reports in the report DB
        //Expected output: formattedReports object
        const response = await request(server).get('/report').send({});
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
});

describe('POST /report/:email', () => {
    test('Valid Request', async () => {
        //Input: Email of user who sent report, aggressor_email, description
        //Expected Status Code: 200
        //Expected Behavior: Adds the report into the report DB and returns the added report and sends a success status
        //Expected output: report object and success status
        const response = await request(server).post('/report/' + validEmail).send({ aggressor_email, description });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('report');
    });

    test('Invalid email provided', async () => {
        //Input: Invalid email provided
        //Expected Status Code: 404
        //Expected Behavior: Returns Error Message
        //Expected output: Error 'User not found'
        const response = await request(server).post('/report/' + invalidEmail).send({ aggressor_email, description });
        expect(response.status).toBe(404);
        expect(response.text).toBe('User not found');
    });
});