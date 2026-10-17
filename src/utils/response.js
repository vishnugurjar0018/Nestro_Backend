const successResponse = (res, message = "Success", data = null) => {
    return res.status(200).json({
        success: true,
        message,
        data
    });
};


const createdResponse = (res, message = "Created successfully", data = null) => {
    return res.status(201).json({
        success: true,
        message,
        data
    });
};


const badResponse = (res, message = "Validation error", data = null) => {
    return res.status(400).json({
        success: false,
        message,
        data
    });
};


const notFoundResponse = (res, message = "Not found") => {
    return res.status(404).json({
        success: false,
        message
    });
};


const conflictResponse = (res, message = "Already exists") => {
    return res.status(409).json({
        success: false,
        message
    });
};


const serverErrorResponse = (res, message = "Internal server error") => {
    return res.status(500).json({
        success: false,
        message
    });
};


export {
    successResponse,
    createdResponse,
    badResponse,
    notFoundResponse,
    conflictResponse,
    serverErrorResponse
};