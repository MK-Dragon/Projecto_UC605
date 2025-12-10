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


        // Get All - with Token Validation

        [HttpGet("getproducts")]
        public async Task<IActionResult> GetProducts()
        {
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


        // UnSave Version (Can't get Fucking Node to work with Tokens! -.-')
        

        // Get All - UnSave Version

        [HttpGet("usgetproducts")]
        public async Task<List<Product>> UsGetProducts()
        {
            return  await _dbServices.GetProducts();
        }

        [HttpGet("usgetcategories")]
        public async Task<List<Category>> UsGetCategories()
        {
            return await _dbServices.GetCategories();
        }

        [HttpGet("usgetstores")]
        public async Task<List<Store>> UsGetStores()
        {
            return await _dbServices.GetStores();
        }

        [HttpGet("usgetstock")]
        public async Task<List<StoreStock>> UsGetStock()
        {
            return await _dbServices.GetStoreStock();
        }


        // Update - UnSave Version

        [HttpGet("usupdatestock")]
        public async Task<List<StoreStock>> UsUpdateStock()
        {
            return await _dbServices.GetStoreStock();
        }


        // Insert - UnSave Version

        [HttpPost("usaddproduct")]
        public async Task<IActionResult> UsAddProduct([FromBody] NewProductRequest NewProduct)
        {
            // Basic Validation
            if (NewProduct == null || string.IsNullOrEmpty(NewProduct.Name) || int.IsNegative(NewProduct.IdCategory))
            {
                // Return HTTP 400 Bad Request if the payload is incomplete
                return BadRequest("Product Data is Missing");
            }

            // Validate if Product Exists
            Product check_product = await _dbServices.GetProductByName(NewProduct.Name); // checking if null did not work...
            if (check_product != null)
            {
                // Return HTTP 401 Unauthorized
                return Unauthorized(new { Message = "Item Already Exists." });
            }

            // Check Category Exists
            Category check_category = await _dbServices.GetCategoryById(NewProduct.IdCategory); // checking if null did not work...
            if (check_category == null)
            {
                // Return HTTP 401 Unauthorized
                return Unauthorized(new { Message = "Category Does NOT Exist." });
            }

            // Passed Tests -> Save to DB

            // save product to database
            try
            {
                await _dbServices.AddProduct(NewProduct);
            }
            catch (Exception)
            {

                return StatusCode(500, new { Message = "Error saving product to database. Check if Category ID Exists." });
            }

            // try to retrieve the inserted product
            try
            {
                Product product = await _dbServices.GetProductByName(NewProduct.Name);
                return Ok(product);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Message = "Error retrieving product from database after insertion." });
            }
        }
    }
}
