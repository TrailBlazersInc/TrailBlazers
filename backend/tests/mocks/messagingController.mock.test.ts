import {describe, expect, jest, test} from "@jest/globals";
import {app} from "../.."
import {MessagingControllers} from "../../controllers/MessagingControllers"
import {Chat} from "../../models/chat"
import { Message } from "../../models/message";
import { User } from "../../models/user";
import mockChats from "../mock_data/tests.chats.json";
import mockUsers from "../mock_data/tests.users.json";

const mockEmail = "someone@gmail.com"

// describe("GET chats/:email", () => {
//     test("successfully getting all chats of the user", async() =>{
//         //Mocked Behavior: Chat
//         //Input: Valid email From a registered user
//         //Expected Status Code: 200
//         //Expected Behavior: All chats where the user is a particpant are returned
//         //Expected output: 
//         afterEach(() => {
//             jest.restoreAllMocks(); // Reset mocks after each test
//           });
//         jest.spyOn(User, "findOne").mockResolvedValueOnce(mockUsers[0]).mockResolvedValue(mockUsers[1])
//         jest.spyOn(Chat, "find").mockResolvedValue(mockChats)







//     });
   
    

// });