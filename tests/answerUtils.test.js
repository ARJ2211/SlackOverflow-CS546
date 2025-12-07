import { ObjectId } from "mongodb";
import * as answerUtils from "../data/answer.js";
import { dbConnection, closeConnection } from "../config/mongoConnection.js";

describe("Answer Utils Tests", () => {
    let db;
    let testQuestionId;
    let testCreatorId;
    let testAnswerId;

    beforeAll(async () => {
        db = await dbConnection();
        testQuestionId = new ObjectId().toString();
        testCreatorId = new ObjectId().toString();
    });

    afterAll(async () => {
        if (db) {
            await db.collection("answers").deleteMany({});
        }
        await closeConnection();
    });

    describe("createAnswer", () => {
        it("should successfully create an answer", async () => {
            const answer = await answerUtils.createAnswer(
                testQuestionId,
                "This is a test answer",
                testCreatorId
            );

            expect(answer).toHaveProperty("_id");
            expect(answer).toHaveProperty("questionId");
            expect(answer).toHaveProperty("answer", "This is a test answer");
            expect(answer).toHaveProperty("created_by");
            expect(answer).toHaveProperty("created_at");
            expect(answer.questionId.toString()).toBe(testQuestionId);
            expect(answer.created_by.toString()).toBe(testCreatorId);

            testAnswerId = answer._id.toString();
        });

        it("should throw error for invalid questionId", async () => {
            await expect(
                answerUtils.createAnswer("invalid-id", "Test answer", testCreatorId)
            ).rejects.toMatch("questionId");
        });

        it("should throw error for empty answer text", async () => {
            await expect(
                answerUtils.createAnswer(testQuestionId, "   ", testCreatorId)
            ).rejects.toMatch("answer");
        });

        it("should throw error for non-string answer", async () => {
            await expect(
                answerUtils.createAnswer(testQuestionId, 12345, testCreatorId)
            ).rejects.toMatch("answer");
        });

        it("should throw error for invalid created_by", async () => {
            await expect(
                answerUtils.createAnswer(testQuestionId, "Test answer", "invalid-id")
            ).rejects.toMatch("created_by");
        });

        it("should trim whitespace from answer text", async () => {
            const answer = await answerUtils.createAnswer(
                testQuestionId,
                "  Whitespace test  ",
                testCreatorId
            );
            expect(answer.answer).toBe("Whitespace test");
        });
    });


});