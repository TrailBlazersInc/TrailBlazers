import { User } from '../../models/user';
import { server } from '../../index';
import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, test, beforeAll, afterAll, jest } from '@jest/globals';

jest.mock('google-auth-library');


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
    process.env.JWT_SECRET = "SECRET_KEY";
});

afterAll(async () => {
    await mongoose.connection.close();
    server.close();
});

describe('POST /api/v1/auth/google (mock)', () => {
    test('Invalid GoogleId', async () => {
        //Input: Invalid GoogleID and false flag for admin
        //Expected Status Code: 500
        //Expected Behavior: Returns Error Message
        //Expected output: Error 'Internal Server Error'
        const response = await request(server).post('/api/v1/auth/google').send({ googleId : 'invalid_mock_token', admin : false });
        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Internal Server Error');
    });
    test('Valid GoogleID but no payload', async () => {
        //Input: Valid GoogleID and false flag for admin
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Error 'Bad Request'
        const response = await request(server).post('/api/v1/auth/google').send({ googleId : 'empty_payload', admin : false });
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Bad Request');
    });
    test('Valid Standard User Request', async () => {
        //Input: Valid GoogleID and false flag for admin
        //Expected Status Code: 200
        //Expected Behavior: Sends back sessionID and user info
        //Expected output: Token for SessionID, user object, flag for banned, false flag for admin
        const response = await request(server).post('/api/v1/auth/google').send({ googleId : 'valid_mock_token', admin : false });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('new_user');
        expect(response.body).toHaveProperty('banned');
        expect(response.body).toHaveProperty('admin', false);
    });
    test('Valid Admin Request', async () => {
        //Input: Valid GoogleID and true flag for admin
        //Expected Status Code: 200
        //Expected Behavior: Sends back sessionID and user info
        //Expected output: Token for SessionID, user object, flag for banned, true flag for admin
        const response = await request(server).post('/api/v1/auth/google').send({ googleId : 'no_name', admin : true });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('new_user');
        expect(response.body).toHaveProperty('banned');
        expect(response.body).toHaveProperty('admin', true);
    });
});

describe('PUT /User/:email (mock)', () => {
    // Mocked behavior: User.updateOne throws an error
    // Input: validEmail with updated preferences
    // Expected status code: 500
    // Expected behavior: Failure to connect to database, returns error message
    // Expected output: Error 'Error Updating User'
    test('cannot find user to update User data, should return 500 and error message', async () => {
        jest.spyOn(User, 'updateOne').mockRejectedValue(new Error('Internal Server Error'));

        const response = await request(server).put('/User/' + invalidEmail).send({ distance , time , pace , availability });
        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Error Updating User');
    });
});