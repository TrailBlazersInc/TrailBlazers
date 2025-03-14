import {describe, expect, jest, test} from "@jest/globals";
import request from "supertest"
import {server} from "../.."
import {MessagingControllers} from "../../controllers/MessagingControllers"
import {Chat} from "../../models/chat"
import { Message } from "../../models/message";
import { User } from "../../models/user";
import mockChats from "../mock_data/tests.chats.json";
import mockUsers from "../mock_data/tests.users.json";
import mongoose from "mongoose";

const validEmail = "someone@gmail.com"
const validEmail2 = "lad@gmail.com"
const validEmail3 = "person@gmail.com"
const fakeEmail = "nonExistent@gmail.com"
const invalidChatId = "000000000000000000000000"
const validMessageId = "000000000000000000000001"
const invalidMessageId = "000000000000000000000000"
const newChatName = "::::Hello"
const someContent = "hello my friend, how is your day?"

afterAll(async () => {
    await mongoose.connection.close()
});

describe("GET chat/:email", () => {
    test("Error on find User", async() =>{
        //Mocked Behavior: Error while retrieving User
        //Input: Valid email From a registered user
        //Expected Status Code: 500
        //Expected Behavior: Failure to connect to db return right away
        //Expected output: error message
        
        jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
            throw new Error("Could not connect to DB");
        });

        const res = await request(server).get(`/chat/${validEmail}`)

        expect(res.status).toBe(500)
    });
   
    test("Error on finding Chats", async() => {
        //Mocked Behavior: Error while retrieving Chats
        //Input: Valid email From a registered user
        //Expected Status Code: 500
        //Expected Behavior: Failure to connect to db return right away
        //Expected output: error message
        
        jest.spyOn(User, "findOne").mockResolvedValueOnce(mockUsers[0]);
        jest.spyOn(Chat, 'find').mockImplementationOnce(() => {
            throw new Error("Could not connect to DB");
        });

        const res = await request(server).get(`/chat/${validEmail}`)
        expect(res.status).toBe(500)

    })

});

describe("GET chat/messages/:chatId", () => {

    test("Error finding chats", async()=>{
        //Mocked Behavior: Error while retrieving Chat
        //Input: Valid email From a registered user
        //Expected Status Code: 500
        //Expected Behavior: Failure to connect to db return right away
        //Expected output: error message
        let chatId = mockChats[0]?._id ?? ""

        jest.spyOn( Chat, "findOne").mockImplementationOnce(() => {
            throw new Error("Could not connect to DB");
        });

        const res = await request(server).get(`/chat/messages/${chatId}`)
        expect(res.status).toBe(500)
    })
});

describe("GET chat/members/:chatId", () => {

    test("Error finding chats", async()=>{
        //Mocked Behavior: Error while retrieving Chat
        //Input: Valid email From a registered user
        //Expected Status Code: 500
        //Expected Behavior: Failure to connect to db return right away
        //Expected output: error message
        let chatId = mockChats[0]?._id ?? ""

        jest.spyOn( Chat, "findOne").mockImplementationOnce(() => {
            throw new Error("Could not connect to DB");
        });

        const res = await request(server).get(`/chat/members/${chatId}`)
        expect(res.status).toBe(500)
    })
});

describe("GET /chat/messages/:chatId/:messageId", () => {

    test("Error finding chats", async()=>{
        //Mocked Behavior: Error while retri
        //Input: Valid email From a registered user
        //Expected Status Code: 500
        //Expected Behavior: Failure to connect to db return right away
        //Expected output: error message
        let chatId = mockChats[0]?._id ?? ""

        jest.spyOn( Chat, "findOne").mockImplementationOnce(() => {
            throw new Error("Could not connect to DB");
        });

        const res = await request(server).get(`/chat/messages/${chatId}/${validMessageId}`)
        expect(res.status).toBe(500)
    })
});

describe("POST /chat/:email", () => {

    test("Error finding User", async()=>{
        //Mocked Behavior: Error while retri
        //Input: Valid email From a registered user
        //Expected Status Code: 500
        //Expected Behavior: Failure to connect to db return right away
        //Expected output: error message

        jest.spyOn( User, "findOne").mockImplementationOnce(() => {
            throw new Error("Could not connect to DB");
        });

        const res = await request(server).post(`/chat/${validEmail}`).send({chatName: newChatName})
        expect(res.status).toBe(500)
    })
});

describe("POST /chat/dm/:email", () => {

    test("Error finding User", async()=>{
        //Mocked Behavior: Error while retri
        //Input: Two valid emails from registered users
        //Expected Status Code: 500
        //Expected Behavior: Failure to connect to db and return right away
        //Expected output: error message

        jest.spyOn( User, "findOne").mockImplementationOnce(() => {
            throw new Error("Could not connect to DB");
        });

        const res = await request(server).post(`/chat/dm/${validEmail}`).send({target_email: validEmail2})
        expect(res.status).toBe(500)
    })
});

describe("POST /chat/message/:chatId", () => {
    test("Error finding Chat", async()=>{
        //Mocked Behavior: Error while retrieving Chat
        //Input: Valid email From a registered user
        //Expected Status Code: 500
        //Expected Behavior: Failure to connect to db return right away
        //Expected output: error message

        jest.spyOn( Chat, "findOne").mockImplementationOnce(() => {
            throw new Error("Could not connect to DB");
        });
        const chatId = mockChats[0]?._id ?? " ";
        const res = await request(server).post(`/chat/message/${chatId}`).send({email: validEmail, content: someContent })
        expect(res.status).toBe(500)
    })
});

describe("PUT /chat/:email", () => {
    test("Error finding User", async()=>{
        //Mocked Behavior: Error while retrieving User
        //Input: Valid email From a registered user
        //Expected Status Code: 500
        //Expected Behavior: Failure to connect to db return right away
        //Expected output: error message
        

        jest.spyOn( User, "findOne").mockImplementationOnce(() => {
            throw new Error("Could not connect to DB");
        });
        
        const chatId = mockChats[0]?._id ?? ""
        const res = await request(server).put(`/chat/${validEmail}`).send({ chatId })
        expect(res.status).toBe(500)
    })
});

