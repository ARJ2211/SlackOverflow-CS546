import * as validator from "./validator.js";

const handleError = (res, error) => {
    let status = 400;
    let message = "Unknown error";

    if (typeof error === "string") {
        message = error;
    } else if (error instanceof Error) {
        message = error.message;
        if (error.status) status = error.status;
    } else if (error && typeof error === "object") {
        message = error.message || JSON.stringify(error);
        if (error.status) status = error.status;
    }

    return res.status(status).json({ message });
}

const getCoursesForProfessor = async (user, coursesData) => {
    if (!user) throw "User not found in session";

    const userId = validator.isValidMongoId(user.id);
    if (user.role !== "professor") return [];

    const courses = await coursesData.getCourseByProfessorId(userId);
    return courses.map(course => ({
        _id: course._id.toString(),
        course_id: course.course_id,
        course_name: course.course_name
    }));
};

export { handleError, getCoursesForProfessor }