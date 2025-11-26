using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Project605_2.Models;
using Project605_2.Services;

namespace Project605_2.Controllers
{
    [Route("api/")]
    [ApiController]
    public class ApiController : ControllerBase
    {
        private readonly ApiService _service;
        private readonly DbServices _dbServices;

        public ApiController(ApiService service)
        {
            _service = service;

            _dbServices = new DbServices(
                "192.168.0.30",
                3333,
                "Logistica_605Forte",
                "root",
                "123"
                );
        }

        // Imposter Endpoints
        [HttpGet("getmarcas")]
        public async Task<IActionResult> GetMarcas()
        {
            /*var result = new MarcasResponse
            {
                Marcas = new List<string> { "Toyota", "Audi", "Ford", "Volvo", "Honda" }
            };*/
            
            var result = await _service.GetMarcas();
            return Ok(result);
        }

        [HttpGet("getmodelos")]
        public async Task<IActionResult> GetModelos()
        {
            var result = await _service.GetModelos();
            return Ok(result);
        }

        // * Database related endpoints *

        // Login
        [HttpPost("login")]
        public async Task<IActionResult> AuthenticateUser([FromBody] LoginRequest loginData)
        {
            // --- 1. Basic Validation ---
            if (loginData == null || string.IsNullOrEmpty(loginData.Username) || string.IsNullOrEmpty(loginData.Password))
            {
                // Return HTTP 400 Bad Request if the payload is incomplete
                return BadRequest("User and password are required.");
            }

            if (await _dbServices.ValidateLogin(loginData))
            {
                return Ok(new { Message = "Login successful!", Token = "a_sample_jwt_token" });
            }
            else
            {
                // Return HTTP 401 Unauthorized
                return Unauthorized(new { Message = "Invalid credentials." });
            }


            // --- 2. Authentication Logic (Replace this with your actual logic) ---
            // e.g., Check the database for the user/password combination
            bool isAuthenticated = (loginData.Username == "admin" && loginData.Password == "pass");

            if (isAuthenticated)
            {
                // In a real application, you would generate a JWT token here
                // or return a user-specific resource.
                return Ok(new { Message = "Login successful!", Token = "a_sample_jwt_token" });
            }
            else
            {
                // Return HTTP 401 Unauthorized
                return Unauthorized(new { Message = "Invalid credentials." });
            }
        }


        // Get All

        [HttpGet("getproducts")]
        public async Task<IActionResult> GetProducts()
        {
            var result = await _dbServices.GetProducts();
            return Ok(result);
        }

        [HttpGet("getstores")]
        public async Task<IActionResult> GetStores()
        {
            var result = await _dbServices.GetStores();
            return Ok(result);
        }




    }
}
