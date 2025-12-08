using Microsoft.AspNetCore.Mvc;

namespace Project605_2.Services
{
    public class LoginService
    {
        private readonly DbServices _dbServices;
        public LoginService(DbServices dbServices)
        {
            _dbServices = dbServices;
        }


        public async Task<IActionResult> ValidateAndGet(
            Func<Task<IActionResult>> functionToRun,
            string functionName = "Unnamed Async Function",
            HttpRequest request = null)
        {
            Console.WriteLine($"--- Starting Pre-Test for **{functionName}** ---");

            // 1. **Pre-Execution Logic (The "Test")**
            // This is where you can perform quick checks or setup.
            if (functionToRun == null)
            {
                Console.WriteLine($"**ERROR:** Function passed for **{functionName}** is null.");
                // Return a standard 500 error if the function delegate is missing
                //return new StatusCodeResult(500);
                return new ObjectResult(new { Message = "Funtion is Null." })
                {
                    StatusCode = 500 // Set the HTTP status code
                };
            }

            if (request == null)
            {
                Console.WriteLine($"**ERROR:** HttpRequest passed for **{functionName}** is null.");
                //return new StatusCodeResult(500);
                return new ObjectResult(new { Message = "Request/Heasder Is Null." })
                {
                    StatusCode = 500 // Set the HTTP status code
                };
            }

            Console.WriteLine($"- Pre-test checks successful for **{functionName}**. Proceeding to execution...");
            
            //var result;

            // 2. **Execution and Error Handling**
            try
            {
                // The key is the 'await' here. This runs the passed function.
                // Since the passed function returns a Task<IActionResult>, 
                // the result of the await is the IActionResult itself.

                // Get Auth Header
                string authorizationHeader = request.Headers["authorization"].FirstOrDefault();
                string username = request.Headers["username"].FirstOrDefault();
                string token = "No Token";

                // Check the is a token
                if (authorizationHeader == null)
                {
                    //return Unauthorized(new { Message = "No token Found." });
                    return new ObjectResult(new { Message = "No token Found." })
                    {
                        StatusCode = 500 // Set the HTTP status code
                    };
                }

                // Get token and user
                token = authorizationHeader.Substring("Bearer ".Length).Trim();

                Console.WriteLine($"Token: {token}");
                Console.WriteLine($"Username: {username}");

                // Validate Token
                if (!await _dbServices.ValidateToken(username, token))
                {
                    //return Unauthorized(new { Message = "Invalid or expired token." });
                    return new ObjectResult(new { Message = "Invalid or expired token." })
                    {
                        StatusCode = 401 // Set the HTTP status code
                    };
                }

                try
                {
                    return await functionToRun();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"**ERROR during function execution in {functionName}: {ex.Message}**");
                    return new ObjectResult(new { Message = "Database Error" })
                    {
                        StatusCode = 500 // Set the HTTP status code
                    };
                }


                //Console.WriteLine($"- Function **{functionName}** completed.");
                //return result;
            }
            catch (Exception err)
            {
                // Catch any unexpected exceptions from the executed function
                Console.WriteLine($"**SERVER ERROR** in **{functionName}**: {err.Message}");
                //return new StatusCodeResult(500); // Return a generic 500 status code
                return new ObjectResult(new { Message = "Something Broke in the Big Ass Catch!" })
                {
                    StatusCode = 500 // Set the HTTP status code
                };

            }
            finally
            {
                Console.WriteLine("--- Execution Finished ---");
            }
        }
    }
}
