// High order function

// Async Await Approach
// const asyncHandler=(fn)=> async(req,res,next)=>{
//     try{
//         await fn(req,res,next)
//     }catch(err){
//         res.status(err.code || 500).json({
//             success:false,
//             message: err.message
//         })
//     }
// }

// Promise Approach
const asyncHandler = (requestHandler) => {
  // Return a new function that takes the request, response and next as arguments
  return (req, res, next) => {
    // Wrap the requestHandler in a Promise
    // If the requestHandler returns a Promise, that Promise is used
    // If the requestHandler does not return a Promise, a new Promise is created and resolved with the return value of the requestHandler
    Promise.resolve(requestHandler(req, res, next))
      // If the Promise rejects, the error is passed to the next function
      // The next function is a function that is passed as an argument to the new function returned by the asyncHandler
      // The next function is a function that is part of the Express.js framework and is used to pass control to the next middleware function in the stack
      // If the next function is called with an error, Express.js will catch the error and call the global error handler
      .catch((err) => next(err));
  };
};

export { asyncHandler };
