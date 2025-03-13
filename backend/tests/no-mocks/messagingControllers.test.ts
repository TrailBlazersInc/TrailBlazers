import {describe, expect, jest, test} from "@jest/globals";
import {app} from "../..";
import mongoose, { mongo } from "mongoose";
import request from 'supertest';
import { Chat } from "../../models/chat"
import { Message } from "../../models/message";
import { User } from "../../models/user";
import mockChats from "../mock_data/tests.chats.json";
import mockUsers from "../mock_data/tests.users.json";
import mockMessages from "../mock_data/tests.messages.json";
import expectedResults from "../expected_results/messagingControllers.json";

const validEmail = "someone@gmail.com"
const validEmail2 = "lad@gmail.com"
const fakeEmail = "nonExistent@gmail.com"
const invalidChatId = "000000000000000000000000"
const expNoMock = expectedResults["no-mock"]
const validMessageId = "000000000000000000000001"
const invalidMessageId = "000000000000000000000000"
const newChatName = "::::Hello"

beforeAll( async()=>{
    await User.create(mockUsers);
    for (const chat of mockChats){
        await Chat.create({...chat, _id: new mongoose.Types.ObjectId(chat._id)});
    }
    for (const message of mockMessages){
        await Message.create({...message, _id: new mongoose.Types.ObjectId(message._id)});
    }
})

afterAll(async () => {
    for (const user of mockUsers){
        await User.deleteMany({email: user.email})
    }
    for (const message of mockMessages){
        await Message.deleteMany({_id: new mongoose.Types.ObjectId(message._id)})
    }
    for (const chat of mockChats){
        await Chat.deleteMany({_id: new mongoose.Types.ObjectId(chat._id)})
    }
});

describe("GET /chat/:email", () => {
    test("Valid Request", async() =>{
        //Input: Valid email From a registered user
        //Expected Status Code: 200
        //Expected Behavior: All chats where the user is a particpant are returned
        //Expected output: The array of Chats without the messages ( only attributures id, title, and members) 

        const res = await request(app).get(`/chat/${validEmail}`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBe(2)
        expect(res.body).toStrictEqual(expNoMock[0])
    });

    test("Invalid email Parameter", async() => {
        //Input: Valid email From a non-registered user
        //Expected Status Code: 400
        //Expected Behavior: Returns Error message
        //Expected output: Message "Invalid emailt"

        const res = await request(app).get(`/chat/${fakeEmail}`)
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid email")
    })
})

describe("GET /chat/messages/:chatId", ()=>{
    test("Valid Request", async()=>{
        //Input: Valid chat ID
        //Expected Status Code: 200
        //Expected Behavior: Returns all messages of that Chat
        //Expected output: The array of messages of the chat
        let chat = await Chat.findOne({title: mockChats[0].title})
        let chatId = chat?._id ?? ""

        const res = await request(app).get(`/chat/messages/${chatId}`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBe(2)
        expect(res.body).toStrictEqual(expNoMock[1])
    })

    test("Invalid chatId", async()=>{
        //Input: Invalid ChatId
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid chat d"
        const res = await request(app).get(`/chat/messages/${invalidChatId}`)
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid chat id")
    })

});

describe("GET /chat/members/:chatId", ()=>{
    test("Valid Request", async()=>{
        //Input: Valid chat ID
        //Expected Status Code: 200
        //Expected Behavior: Returns all messages of that Chat
        //Expected output: Returns an array of all the user emails in the Chat 
        let chat = await Chat.findOne({title: mockChats[1].title});
        let chatId = chat?._id ?? "";
        const res = await request(app).get(`/chat/members/${chatId}`)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual(expNoMock[2])

    })

    test("Invalid chatId", async()=>{
        //Input: Invalid ChatId
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid chat id"
        const res = await request(app).get(`/chat/members/${invalidChatId}`)
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid chat id")
       
    })

});

describe("GET /chat/messages/:chatId/:messageId", ()=>{
    test("Valid Request", async()=>{
        //Input: Valid chat ID, Valid Message ID the chat contains
        //Expected Status Code: 200
        //Expected Behavior: Returns all messages of that Chat whose date is after the message with id messageId
        //Expected output: Returns an array of message objects ordered in by date in non-ascending order 
        let chat = await Chat.findOne({title: mockChats[1].title});
        let chatId = chat?._id ?? "";
        
        const res = await request(app).get(`/chat/messages/${chatId}/${validMessageId}`)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual(expNoMock[3])

    })

    test("Invalid Message Id", async()=>{
        //Input: Valid Chat Id, Invalid Message Id
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid Message Id"

        let chat = await Chat.findOne({title: mockChats[1].title});
        let chatId = chat?._id ?? "";

        const res = await request(app).get(`/chat/messages/${chatId}/${invalidMessageId}`)
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid message id")
    })

    test("Invalid chatId", async()=>{
        //Input: Invalid ChatId
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid Chat Id"

        const res = await request(app).get(`/chat/messages/${invalidChatId}/${validMessageId}`)
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid chat id")
    })

});

describe("POST /chat/:email", ()=>{
    test("Valid Request", async()=>{
        //Input: Valid user email and a chat title
        //Expected Status Code: 201
        //Expected Behavior: Creates a new chat with only the user creating it being the member
        //Expected output: The object of the newly created chat without messages
        
        const res = await request(app).post(`/chat/${validEmail2}`).send({chatName: newChatName})
        expect(res.status).toBe(201)
        expect(mongoose.Types.ObjectId.isValid(res.body?.id)).toBe(true)
        expect(res.body.members).toBe(1)
        expect(res.body.title).toBe(newChatName)

        await Chat.deleteMany({_id: new mongoose.Types.ObjectId(res.body.id)})

    })

    test("Invalid email", async()=>{
        //Input: Invalid email and a chat title
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid email"


        const res = await request(app).get(`/chat/${fakeEmail}`).send({chatName: newChatName})
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid email")
    })
});





