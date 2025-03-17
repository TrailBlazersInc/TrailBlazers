import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { server } from '../../index';
import { User } from '../../models/user';
import crypto from 'crypto';

const validEmail = crypto.randomUUID() + '@example.com';
const invalidEmail = "invalidmockUser@example.com";
const distance = '5km';
const time = '2 hour';
const pace = 5;
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
    await mongoose.connection.close();
    server.close();
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