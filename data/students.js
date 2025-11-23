import * as validator from "../utils/validator.js";
import { courses, users } from "../config/mongoCollections.js";

const getAllStudentsByCourseId = async (courseUuid) => {

    courseUuid = validator.isValidMongoId(courseUuid);
    const courseColl = await courses();
    const course = await courseColl.findOne({ _id: courseUuid });
    if (!course) throw { status: 404, message: "Course not found" };

    const usersColl = await users();


    const studentsArray = [];
    for (let enrolledStudent of course.enrolled_students) {
        enrolledStudent.user_id = validator.isValidMongoId(enrolledStudent.user_id);
        const studentUserData = await usersColl.findOne({
            _id: enrolledStudent.user_id,
        });
        if (!studentUserData) {
            throw { status: 404, message: "user not found" };
        }
        studentsArray.push({
            _id: studentUserData._id,
            first_name: studentUserData.first_name,
            last_name: studentUserData.last_name,
            email: studentUserData.email,
            is_ta: enrolledStudent.is_ta,
            status: studentUserData.status,
            course_code: course.course_id,
            course_name: course.course_name

        });
    }

    return studentsArray

}

export { getAllStudentsByCourseId }