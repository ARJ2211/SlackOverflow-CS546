// LEAN SCHEMA: 4 collections (users, courses, questions, answers)
// Labels live on each course; questions store label IDs from course.labels._id.

// =========================
// users
// =========================
// Password-only login (stored as plain text per your request).
const Users = {
    _id: ObjectId, // user id
    email: String, // unique email for login
    name: String, // display name (placeholder allowed for invited students)
    role: String, // "student" | "ta" | "professor" | "admin"
    status: String, // "inactive" until they set a password; then "active"
    password: String, // plain text password (no hashing)
    created_at: Date, // when the user was created
};

// =========================
// courses
// =========================
// Course info, who created it, roster, and label list.
const Courses = {
    _id: ObjectId, // course id
    course_name: String, // e.g., "Web Programming"
    course_id: String, // e.g., "CS546" (keep unique)
    course_description: String, // short text about the course

    created_by: ObjectId, // users._id of the professor/admin who created this course

    enrolled_students: [
        // members of this course with their role
        {
            user_id: ObjectId, // users._id
            role: String, // "instructor" | "ta" | "student"
        },
    ],

    labels: [
        // labels for this course; names must be unique within this array
        {
            _id: ObjectId, // label id (referenced by questions.labels)
            name: String, // label name unique within this course, e.g., "Assignment 1"
        },
    ],

    created_at: Date, // when the course was created
    updated_at: Date, // last time roster or labels changed
};

// =========================
// questions
// =========================
// A post in a course. Votes and bookmarks stored inline to keep it simple.
const Questions = {
    _id: ObjectId, // question id
    course: ObjectId, // courses._id
    author_id: ObjectId, // users._id (who asked)
    question: String, // question text

    canonical_key: String, // normalized key for dedupe/suggestions
    embedding: [Number], // optional vector for similarity search

    labels: [ObjectId], // ids from course.labels._id (must belong to this course)

    upvotes: [ObjectId], // user ids who upvoted (use $addToSet)
    bookmarks: [ObjectId], // user ids who bookmarked (use $addToSet)

    accepted_answer_id: ObjectId | null, // answers._id if resolved; null otherwise
    status: String, // "open" or "resolved" (keep in sync with accepted_answer_id)

    answer_count: Number, // optional cached number of answers for faster lists

    created_time: Date, // when the question was created
    updated_at: Date, // last edit or status change
};

// =========================
// answers
// =========================
// Flat list of answers under a question (no replies to answers - feature depricated).
const Answers = {
    _id: ObjectId, // answer id
    questionId: ObjectId, // questions._id
    created_by: ObjectId, // users._id (who answered)

    answer: String, // answer text (not empty)
    is_accepted: Boolean, // true if this is the accepted answer

    created_at: Date, // when the answer was posted
};
