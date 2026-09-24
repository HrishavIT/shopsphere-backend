import AppError from "../utils/AppError.js";

const validate = (validationFn) => {
    return (req, res, next) => {
        try {
            validationFn(req);

            next();
        } catch (error) {
            next(error);
        }
    };
};

export default validate;