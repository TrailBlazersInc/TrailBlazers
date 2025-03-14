jest.mock('google-auth-library');

import { describe, expect, test, beforeAll, afterAll, jest } from '@jest/globals';
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
          monday: true,
          tuesday: false,
          wednesday: true,
          thursday: false,
          friday: true,
          saturday: false,
          sunday: true,
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

describe('user module (No Mock)', () => {
    test('does not input googleId, should return 400 error code', async () => {
        const response = await request(server).post('/api/v1/auth/google').send({});
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('ID is required');
    });
    test('get User data, should return 200 and user data', async () => {
        const response = await request(server).get('/User/' + validEmail).send({});
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('user');
    });
    test('update User data, should return 200 and success message', async () => {
        const response = await request(server).put('/User/' + validEmail).send({ distance : distance, time : time, pace : pace, availability : availability });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'User data updated successfully');
    });
    test('cannot find user to update User data, should return 400 and error message', async () => {
        const response = await request(server).put('/User/' + invalidEmail).send({ distance : distance, time : time, pace : pace, availability : availability });
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('User not found');
    });
});

describe('user module (Mock)', () => {
    test('invalid googleId, should return 500 error code', async () => {
        const response = await request(server).post('/api/v1/auth/google').send({ googleId : 'invalid_mock_token', admin : false });
        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Internal Server Error');
    });
    test('empty payload, should return 400 error code', async () => {
        const response = await request(server).post('/api/v1/auth/google').send({ googleId : 'empty_payload', admin : false });
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Bad Request');
    });
    test('valid IDToken provided, no admin access, should return 200, along with encrypted userID, user info, ban status and boolean for admin', async () => {
        const response = await request(server).post('/api/v1/auth/google').send({ googleId : 'valid_mock_token', admin : false });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('new_user');
        expect(response.body).toHaveProperty('banned');
        expect(response.body).toHaveProperty('admin', false);
    });
    test('valid IDToken provided, has admin access but no name, should return 200, along with encrypted userID, user info, ban status and boolean for admin', async () => {
        const response = await request(server).post('/api/v1/auth/google').send({ googleId : 'no_name', admin : true });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('new_user');
        expect(response.body).toHaveProperty('banned');
        expect(response.body).toHaveProperty('admin', true);
    });
    test('cannot find user to update User data, should return 500 and error message', async () => {
        jest.spyOn(User, 'updateOne').mockRejectedValue(new Error('Internal Server Error'));

        const response = await request(server).put('/User/' + invalidEmail).send({ distance : distance, time : time, pace : pace, availability : availability });
        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Error Updating User');
    });
});