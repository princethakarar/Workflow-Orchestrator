class ApiResponse {
    constructor(statusCode, data, message = "success", metadata = null) {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400

        // Include metadata if provided
        if (metadata) {
            this.metadata = metadata
        }
    }
}

export { ApiResponse };