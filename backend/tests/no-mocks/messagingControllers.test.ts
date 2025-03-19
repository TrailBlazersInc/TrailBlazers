import {describe, expect, test} from "@jest/globals";
import { server } from "../..";
import mongoose from "mongoose";
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
const validEmail3 = "person@gmail.com"
const fakeEmail = "nonExistent@gmail.com"
const invalidChatId = "000000000000000000000000"
const expNoMock = expectedResults["no-mock"]
const validMessageId = "000000000000000000000001"
const invalidMessageId = "000000000000000000000000"
const newChatName = "::::Hello"
const someContent = "hello my friend, how is your day?"

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

    await mongoose.connection.close()
});

describe("GET /chat/:email", () => {
    test("Valid Request", async() =>{
        //Input: Valid email From a registered user
        //Expected Status Code: 200
        //Expected Behavior: All chats where the user is a particpant are returned
        //Expected output: The array of Chats without the messages ( only attributures id, title, and members) 

        const res = await request(server).get(`/chat/${validEmail}`)
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

        const res = await request(server).get(`/chat/${fakeEmail}`)
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
        let chatId = chat?._id.toString() ?? ""

        const res = await request(server).get(`/chat/messages/${chatId}`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBe(3)
        expect(res.body).toStrictEqual(expNoMock[1])
    })

    test("Invalid chatId", async()=>{
        //Input: Invalid ChatId
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid chat d"
        const res = await request(server).get(`/chat/messages/${invalidChatId}`)
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid chat id")
    })

});

describe("GET /chat/members/:chatId", ()=>{
    test("Valid Request", async()=>{
        //Input: Valid chat ID
        //Expected Status Code: 200
        //Expected Behavior: Returns all members of that Chat
        //Expected output: Returns an array of all the user emails and names (first name) in the Chat 
        let chat = await Chat.findOne({title: mockChats[1].title});
        let chatId = chat?._id.toString() ?? "";
        const res = await request(server).get(`/chat/members/${chatId}`)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual(expNoMock[2])

    })

    test("Invalid chatId", async()=>{
        //Input: Invalid ChatId
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid chat id"
        const res = await request(server).get(`/chat/members/${invalidChatId}`)
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
        let chatId = mockChats[0]?._id ?? "";
        
        const res = await request(server).get(`/chat/messages/${chatId}/${validMessageId}`)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual(expNoMock[3])

    })

    test("Invalid Message Id", async()=>{
        //Input: Valid Chat Id, Invalid Message Id
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid Message Id"

        let chat = await Chat.findOne({title: mockChats[1].title});
        let chatId = chat?._id.toString() ?? "";

        const res = await request(server).get(`/chat/messages/${chatId}/${invalidMessageId}`)
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid message id")
    })

    test("Invalid chatId", async()=>{
        //Input: Invalid ChatId
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid chat id"

        const res = await request(server).get(`/chat/messages/${invalidChatId}/${validMessageId}`)
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid chat id")
    })

});

describe("POST /chat/:email", ()=>{
    test("Valid Request", async()=>{
        //Input: A valid Email and Chat Title as string
        //Expected Status Code: 201
        //Expected Behavior: Creates a new chat with only the user creating it being the member
        //Expected output: The object of the newly created chat without messages
        
        const res = await request(server).post(`/chat/${validEmail}`).send({chatName: newChatName })
        if (res.status == 200 || res.status == 201){
            await Chat.deleteMany({_id: new mongoose.Types.ObjectId(res.body?.id)})
        }
        expect(res.status).toBe(201)
        expect(mongoose.Types.ObjectId.isValid(res.body?.id)).toBe(true)
        expect(res.body.members).toBe(1)
        expect(res.body.title).toBe(newChatName)

    }),

    test("Invalid email", async ()=>{
        //Input: invalid email, and a title string
        //Expected Status Code: 400
        //Expected Behavior: Sends error message
        //Expected output: Message "Invalid email"
        
        const res = await request(server).post(`/chat/${fakeEmail}`).send({chatName: newChatName})
        expect(res.status).toBe(400)
        expect(res.text).toStrictEqual("Invalid email")

    })
});

describe("POST /chat/dm/:email", ()=>{
    test("Valid Request", async()=>{
        //Input: Two valid emails that have not DMed 
        //Expected Status Code: 201
        //Expected Behavior: Creates a new chat with the two users
        //Expected output: The object of the newly created chat without messages
        
        const res = await request(server).post(`/chat/dm/${validEmail2}`).send({target_email: validEmail3})
        if (res.status == 200 || res.status == 201){
            await Chat.deleteMany({_id: new mongoose.Types.ObjectId(res.body.id)})
        }
        expect(res.status).toBe(201)
        expect(mongoose.Types.ObjectId.isValid(res.body?.id)).toBe(true)
        expect(res.body.members).toBe(2)

    }),

    test("Valid Request Existing Chat", async()=>{
        //Input: Two valid emails that are already in a DM chat
        //Expected Status Code: 200
        //Expected Behavior: Retrieves the DM chat between the two users
        //Expected output: The object of the existing chat without messages
        
        const res = await request(server).post(`/chat/dm/${validEmail}`).send({target_email: validEmail2})
        expect(res.status).toBe(200)
        expect(mongoose.Types.ObjectId.isValid(res.body?.id)).toBe(true)
        expect(res.body.members).toBe(2)

     

    }),

    test("Invalid email", async()=>{
        //Input: Invalid email and a valid Target email
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid email"


        const res = await request(server).post(`/chat/dm/${fakeEmail}`).send({target_email: validEmail})
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid email")
    })

    test("Invalid target email email", async()=>{
        //Input: Valid registered email and invalid target email
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid email"


        const res = await request(server).post(`/chat/dm/${validEmail}`).send({target_email: fakeEmail})
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid target email")
    })
});

describe("POST /chat/message/:chatId", ()=>{
    test("Valid Request", async()=>{
        //Input: Valid Chat Id, Valid Email, and content string
        //Expected Status Code: 201
        //Expected Behavior: Creates a new message in the chat
        //Expected output: The newly created message object
        let chat = await Chat.findOne({title: mockChats[0].title})
        let chatId = chat?._id.toString() ?? " ";
        const res = await request(server).post(`/chat/message/${chatId}`).send({email: validEmail, content: someContent })
        if (res.status == 201){
            await Message.deleteMany({_id: res.body?._id})
        }
        expect(res.status).toBe(201)
        expect(mongoose.Types.ObjectId.isValid(res.body?._id)).toBe(true)
        expect(res.body.content).toStrictEqual(someContent)
        expect(res.body.sender_email).toBe(validEmail)
    })

    test("Invalid chatId", async()=>{
        //Input: Valid email and an invalid chat id 
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid email"


        const res = await request(server).post(`/chat/message/${invalidChatId}`).send({email: validEmail, content: someContent })
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid chat id")
    })

    test("Invalid email", async()=>{
        //Input: Invalid email and a chat title
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid email"

        let chat = await Chat.findOne({title: mockChats[0].title})
        let chatId = chat?._id.toString() ?? " ";

        const res = await request(server).post(`/chat/message/${chatId}`).send({email: fakeEmail, content: someContent })
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid email")
    })

    test("Valid email not member of the chat", async()=>{
        //Input: Valid email not member of chat, chat Id and string content
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Email not in chat"

        let chat = await Chat.findOne({title: mockChats[0].title})
        let chatId = chat?._id.toString() ?? " ";

        const res = await request(server).post(`/chat/message/${chatId}`).send({email: validEmail2, content: someContent })
        expect(res.status).toBe(400)
        expect(res.text).toStrictEqual("Email not in chat")
    })
})

describe("PUT /chat/:email", ()=>{
    test("Valid Request", async()=>{
        //Input: Valid Email and valid chatId
        //Expected Status Code: 200
        //Expected Behavior: Adds member to the chat
        //Expected output: Chat object with 3 members and no messages
        let chat = await Chat.findOne({title: mockChats[0].title})
        let chatId: string = chat?._id.toString().toString() ?? " ";
        const res = await request(server).put(`/chat/${validEmail2}`).send({chatId})
        
        expect(res.status).toBe(200)
        expect(mongoose.Types.ObjectId.isValid(res.body?.id)).toBe(true)
        expect(res.body.members).toBe(3)
    })

    test("Valid Request member already in chat", async()=>{
        //Input: Valid Email and valid chatId
        //Expected Status Code: 200
        //Expected Behavior: Sends the chat with no modificatoins
        //Expected output: Chat object with 2 members and no messages
        const res = await request(server).put(`/chat/${validEmail}`).send({chatId: mockChats[1]._id})
        
        expect(res.status).toBe(200)
        expect(mongoose.Types.ObjectId.isValid(res.body?.id)).toBe(true)
        expect(res.body?.members).toBe(2)
    })

    test("Invalid chatId", async()=>{
        //Input: Valid email and an invalid chat id 
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid chat id"

        const res = await request(server).put(`/chat/${validEmail2}`).send({chatId: invalidChatId})
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid chat id")
    })

    test("Invalid email", async()=>{
        //Input: Invalid email and a valid chat id
        //Expected Status Code: 400
        //Expected Behavior: Returns Error Message
        //Expected output: Message "Invalid email"

        let chat = await Chat.findOne({title: mockChats[0].title})
        let chatId = chat?._id.toString() ?? " ";

        const res = await request(server).put(`/chat/${fakeEmail}`).send({ chatId })
        expect(res.status).toBe(400)
        expect(res.text).toBe("Invalid email")
    })
})




