class ApiError extends Error {
  /**
   * Constructor for ApiError class.
   * @param {Number} statusCode - HTTP status code
   * @param {String} message - Message to be sent in the response
   * @param {Array<Object>} errors - Array of error objects
   * @param {String} stack - Stack trace of the error
   */
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = "",
  ) {
    // Calling the parent class constructor
    super(message);
    // Setting the status code of the response
    this.statusCode = statusCode;
    // Setting the message of the response
    this.message = message;
    // Setting the data of the response to null
    this.data = null;
    // Setting the success property of the response to false
    this.success = false;
    // Setting the errors property of the response to the errors array
    this.errors = errors;
    // If a stack trace is provided, set the stack property of the response to it
    if (stack) this.stack = stack;
    // Otherwise, capture the stack trace of the error using Error.captureStackTrace
    else Error.captureStackTrace(this, this.constructor);
  }
}

export { ApiError };
