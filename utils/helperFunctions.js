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

export { handleError }