class ApiResponse {
  /**
   * Constructor for ApiResponse class.
   * @param {Number} statusCode - HTTP status code
   * @param {String} message - Message to be sent in the response
   * @param {Object} data - Response data
   */
  constructor(statusCode, message = "Success", data) {
    /**
     * HTTP status code of the response.
     * Determines if the response is a success or failure.
     */
    this.statusCode = statusCode;

    /**
     * Message to be sent in the response.
     * Can be a success message or an error message.
     */
    this.message = message;

    /**
     * Response data.
     * Can be an object, array, string, etc.
     */
    this.data = data;

    /**
     * Boolean indicating if the response is a success.
     * True if the status code is less than 400.
     */
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
