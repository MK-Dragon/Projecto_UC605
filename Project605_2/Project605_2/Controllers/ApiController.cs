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
        private readonly TokenService _tokenService;

        public ApiController(ApiService service, TokenService tokenService)
        {
            _service = service;

            _dbServices = new DbServices(
                "192.168.0.30",
                3333,
                "Logistica_605Forte",
                "root",
                "123"
                );

            _tokenService = tokenService;
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
            // Basic Validation
            if (loginData == null || string.IsNullOrEmpty(loginData.Username) || string.IsNullOrEmpty(loginData.Password))
            {
                // Return HTTP 400 Bad Request if the payload is incomplete
                return BadRequest("User and password are required.");
            }

            if (await _dbServices.ValidateLogin(loginData))
            {
                User user = await _dbServices.GetUserByUsername(loginData.Username);

                // Generate JWT Token
                string token = _tokenService.GenerateToken(loginData.Username);
                user.Token = token;
                user.ExpiresAt = DateTime.UtcNow.AddHours(2); // Token valid for 2 hours
                user.CreatedAt = DateTime.UtcNow;

                // save token to database
                try
                {
                    await _dbServices.UpdateUserToken(user);
                }
                catch (Exception)
                {

                    return StatusCode(500, new { Message = "Error saving token to database." });
                }                

                return Ok(new {
                    Message = "Login successful!",
                    Username = loginData.Username,
                    Token = token
                });
            }
            else
            {
                // Return HTTP 401 Unauthorized
                return Unauthorized(new { Message = "Invalid credentials." });
            }
        }

        [HttpPost("logout")] // TODO: Implement logout endpoint
        public async Task<IActionResult> LogoutUser([FromBody] LoginRequest loginData)
        {
            // Basic Validation
            if (loginData == null || string.IsNullOrEmpty(loginData.Username) || string.IsNullOrEmpty(loginData.Password))
            {
                // Return HTTP 400 Bad Request if the payload is incomplete
                return BadRequest("User and password are required.");
            }

            if (await _dbServices.ValidateLogin(loginData))
            {
                User user = await _dbServices.GetUserByUsername(loginData.Username);

                // Generate JWT Token
                string token = _tokenService.GenerateToken(loginData.Username);
                user.Token = token;
                user.ExpiresAt = DateTime.UtcNow.AddHours(2); // Token valid for 2 hours
                user.CreatedAt = DateTime.UtcNow;

                // save token to database
                try
                {
                    await _dbServices.UpdateUserToken(user);
                }
                catch (Exception)
                {

                    return StatusCode(500, new { Message = "Error saving token to database." });
                }

                return Ok(new
                {
                    Message = "Login successful!",
                    Username = loginData.Username,
                    Token = token
                });
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
            try
            {
                var result = await _dbServices.GetProducts();
                return Ok(result);
            }
            catch (Exception err)
            {
                return StatusCode(500, new { Message = $"Server Error. {err.Message}" });
            }
        }

        [HttpGet("getstores")]
        public async Task<IActionResult> GetStores()
        {
            try
            {
                var result = await _dbServices.GetStores();
                return Ok(result);
            }
            catch (Exception err)
            {
                return StatusCode(500, new { Message = $"Server Error. {err.Message}" });
            }
        }


        // ??

    }
}
