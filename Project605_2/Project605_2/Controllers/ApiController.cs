using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Project605_2.ApiRequest;
using Project605_2.ModelRequests;
using Project605_2.Models;
using Project605_2.Services;
using System.Linq.Expressions;

namespace Project605_2.Controllers
{
    [Route("api/")]
    [ApiController]
    public class ApiController : ControllerBase
    {
        private readonly ApiService _service;
        private readonly DbServices _dbServices;
        private readonly TokenService _tokenService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly LoginService _loginService;

        public ApiController(ApiService service, TokenService tokenService, IHttpContextAccessor httpContextAccessor)
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
            _httpContextAccessor = httpContextAccessor;
            _loginService = new LoginService(_dbServices);
        }


        /*/ Imposter Endpoints
        [HttpGet("getmarcas")]
        public async Task<IActionResult> GetMarcas()
        {
            var result = await _service.GetMarcas();
            return Ok(result);
        }

        [HttpGet("getmodelos")]
        public async Task<IActionResult> GetModelos()
        {
            var result = await _service.GetModelos();
            return Ok(result);
        }*/


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
            /*try
            {
                // Get Auth Header
                var request = _httpContextAccessor.HttpContext.Request;
                string authorizationHeader = request.Headers["Authorization"].FirstOrDefault();
                string username = request.Headers["Username"].FirstOrDefault();
                string token = "No Token";
                
                // Check the is a token
                if (authorizationHeader == null)
                {
                    return Unauthorized(new { Message = "No token Found." });
                }

                // Get token and user
                token = authorizationHeader.Substring("Bearer ".Length).Trim();

                Console.WriteLine($"Token: {token}");
                Console.WriteLine($"Username: {username}");

                // Validate Token
                if (!await _dbServices.ValidateToken(username, token))
                {
                    return Unauthorized(new { Message = "Invalid or expired token." });
                }

                var result = await _dbServices.GetProducts();
                return Ok(result);
            }
            catch (Exception err)
            {
                return StatusCode(500, new { Message = $"Server Error. {err.Message}" });
            }*/


            // Refector:
            return await _loginService.ValidateAndGet(
                async () => 
                {
                    var result = await _dbServices.GetProducts();
                    return Ok(result);
                },
                "GetProducts",
                _httpContextAccessor.HttpContext.Request
            );

        }

        [HttpGet("getcategories")]
        public async Task<IActionResult> GetCategories()
        {
            return await _loginService.ValidateAndGet(
                async () =>
                {
                    var result = await _dbServices.GetCategories();
                    return Ok(result);
                },
                "GetCategories",
                _httpContextAccessor.HttpContext.Request
            );
        }

        [HttpGet("getstores")]
        public async Task<IActionResult> GetStores()
        {
            return await _loginService.ValidateAndGet(
                async () =>
                {
                    var result = await _dbServices.GetStores();
                    return Ok(result);
                },
                "GetStores",
                _httpContextAccessor.HttpContext.Request
            );
        }


        // ??


        // Helpers ^_^
        
    }
}
