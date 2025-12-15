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
        

        public ApiController(ApiService service, TokenService tokenService, IHttpContextAccessor httpContextAccessor, ConnectionSettings connectionSettings)  // Settings INJECTED HERE
        {
            //Console.WriteLine($"Loaded Settings: DB IP = {connectionSettings.IpDb}, DB Port = {connectionSettings.PortDb}, Redis IP = {connectionSettings.IpRedis}, Redis Port = {connectionSettings.PortRedis}");

            _service = service;

            _dbServices = new DbServices(
                // MySQL
                connectionSettings.IpDb,
                connectionSettings.PortDb,
                "Logistica_605Forte",
                connectionSettings.UserDb,
                connectionSettings.PassDb,
                // Redis
                connectionSettings.IpRedis,
                connectionSettings.PortRedis
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
        public async Task<IActionResult> LogoutUser([FromBody] LoginRequest user) // TODO LOL
        {
            Console.WriteLine($"Logout request for user: {user.Username}");
            // Basic Validation
            if (user == null || string.IsNullOrEmpty(user.Username))
            {
                // Return HTTP 400 Bad Request if the payload is incomplete
                return BadRequest("Username is required.");
            }

            // Check Category Exists
            User check_user = await _dbServices.GetUserByUsername(user.Username); // checking if null did not work...
            if (check_user == null)
            {
                // Return HTTP 401 Unauthorized
                return Unauthorized(new { Message = "User Does not Exist." });
            }

            try
            {
                if (await _dbServices.InvalidateToken(check_user))
                {
                    return Ok(new
                    {
                        Message = "User was Logged out successful!"
                    });
                }
                else
                {
                    return StatusCode(500, new { Message = "DB Error Invalidating token in database." });
                }
            }
            catch (Exception)
            {
                return StatusCode(500, new { Message = "Error Invalidating token in database." });
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
        public async Task<List<InventoryRequested>> UsGetStock()
        {
            return await _dbServices.GetStoreStock();
        }


        // Update - UnSave Version

        [HttpPut("usupdatestock")]
        public async Task<IActionResult> UsUpdateStock([FromBody] StoreStock Inventory)
        {
            // Basic Validation
            if (Inventory == null || int.IsNegative(Inventory.IdStore) || int.IsNegative(Inventory.IdProduct))
            {
                // Return HTTP 400 Bad Request if the payload is incomplete
                return BadRequest("StoreStock Data is Missing");
            }

            // Validate if Inventory Exists
            StoreStock check_invetory = await _dbServices.GetStoreStockById(Inventory.IdStore, Inventory.IdProduct); // checking if null did not work...
            if (check_invetory == null)
            {
                try
                {
                    await _dbServices.AddStoreStock(Inventory);
                }
                catch (Exception)
                {

                    return StatusCode(500, new { Message = "Error saving StoreStock to database. Check if Store and Product ID Exists." });
                }
            }
            else
            {
                try
                {
                    await _dbServices.UpdateStoreStock(Inventory);
                }
                catch (Exception)
                {

                    return StatusCode(500, new { Message = "Error updating StoreStock to database. Check if Store and Product ID Exists." });
                }
            }

            try
            {
                StoreStock check_inv = await _dbServices.GetStoreStockById(Inventory.IdStore, Inventory.IdProduct);
                return Ok(check_inv);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Message = "Error retrieving Inventory from database after insertion." });
            }

        }

        [HttpPut("usupdatestocksum")]
        public async Task<IActionResult> UsAddStock([FromBody] StoreStock Inventory)
        {
            // Basic Validation
            if (Inventory == null || int.IsNegative(Inventory.IdStore) || int.IsNegative(Inventory.IdProduct))
            {
                // Return HTTP 400 Bad Request if the payload is incomplete
                return BadRequest("StoreStock Data is Missing");
            }

            // Validate if Inventory Exists
            StoreStock check_invetory = await _dbServices.GetStoreStockById(Inventory.IdStore, Inventory.IdProduct); // checking if null did not work...
            if (check_invetory == null)
            {
                try
                {
                    await _dbServices.AddStoreStock(Inventory);
                }
                catch (Exception)
                {

                    return StatusCode(500, new { Message = "Error saving StoreStock to database. Check if Store and Product ID Exists." });
                }
            }
            else
            {
                try
                {
                    await _dbServices.UpdateStoreStock_Sum(Inventory, check_invetory.Stock);
                }
                catch (Exception)
                {

                    return StatusCode(500, new { Message = "Error updating StoreStock to database. Check if Store and Product ID Exists." });
                }
            }

            try
            {
                StoreStock check_inv = await _dbServices.GetStoreStockById(Inventory.IdStore, Inventory.IdProduct);
                return Ok(check_inv);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Message = "Error retrieving Inventory from database after insertion." });
            }

        }

        [HttpPut("usupdateproduct")]
        public async Task<IActionResult> UsUpdateProduct([FromBody] Product ProductUpdated)
        {
            Console.WriteLine($"!!! Update Product !!! - [{ProductUpdated.Id}] {ProductUpdated.Name} - {ProductUpdated.IdCategory}");
            // Basic Validation
            if (ProductUpdated == null || ProductUpdated.Id <= 0 || string.IsNullOrEmpty(ProductUpdated.Name) || ProductUpdated.IdCategory <= 0)
            {
                // Return HTTP 400 Bad Request if the payload is incomplete
                return BadRequest("Product Data is Missing");
            }

            // Validate if Product Exists
            Product check_product = await _dbServices.GetProductById(ProductUpdated.Id); // checking if null did not work...
            if (check_product != null)
            {
                try
                {
                    await _dbServices.UpdateProduct(ProductUpdated);
                }
                catch (Exception)
                {

                    return StatusCode(500, new { Message = "Error updating StoreStock to database. Check if Product ID Exists." });
                }
            }

            try
            {
                Product check_up_pro = await _dbServices.GetProductByName(ProductUpdated.Name);
                return Ok(check_up_pro);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Message = "Error retrieving Product from database after update." });
            }

        }

        [HttpPut("usupdatecategory")]
        public async Task<IActionResult> UsUpdateCategory([FromBody] Category CategoryUpdated)
        {
            // Basic Validation
            if (CategoryUpdated == null || CategoryUpdated.Id <= 0 || string.IsNullOrEmpty(CategoryUpdated.Name))
            {
                // Return HTTP 400 Bad Request if the payload is incomplete
                return BadRequest("StoreStock Data is Missing");
            }

            // Validate if Product Exists
            Category check_product = await _dbServices.GetCategoryById(CategoryUpdated.Id); // checking if null did not work...
            if (check_product != null)
            {
                try
                {
                    await _dbServices.UpdateCategory(CategoryUpdated);
                }
                catch (Exception)
                {

                    return StatusCode(500, new { Message = "Error updating StoreStock to database. Check if Category ID Exists." });
                }
            }

            try
            {
                Category check_up_pro = await _dbServices.GetCategoryByName(CategoryUpdated.Name);
                return Ok(check_up_pro);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Message = "Error retrieving Category from database after update." });
            }

        }

        [HttpPut("usupdatestore")]
        public async Task<IActionResult> UsUpdateStore([FromBody] Store StoreUpdated)
        {
            // Basic Validation
            if (StoreUpdated == null || StoreUpdated.Id <= 0 || string.IsNullOrEmpty(StoreUpdated.Name))
            {
                // Return HTTP 400 Bad Request if the payload is incomplete
                return BadRequest("StoreStock Data is Missing");
            }

            // Validate if Product Exists
            Store check_store = await _dbServices.GetStoreById(StoreUpdated.Id); // checking if null did not work...
            if (check_store != null)
            {
                try
                {
                    await _dbServices.UpdateStore(StoreUpdated);
                }
                catch (Exception)
                {

                    return StatusCode(500, new { Message = "Error updating StoreStock to database. Check if Category ID Exists." });
                }
            }

            try
            {
                Store check_up_st = await _dbServices.GetStoreByName(StoreUpdated.Name);
                return Ok(check_up_st);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Message = "Error retrieving Category from database after update." });
            }

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

        [HttpPost("usaddcategory")]
        public async Task<IActionResult> UsAddCategory([FromBody] NewCategoryRequest NewCategory)
        {
            // Basic Validation
            if (NewCategory == null || string.IsNullOrEmpty(NewCategory.Name))
            {
                // Return HTTP 400 Bad Request if the payload is incomplete
                return BadRequest("Product Data is Missing");
            }

            // Check Category Exists
            Category check_category = await _dbServices.GetCategoryByName(NewCategory.Name); // checking if null did not work...
            if (check_category != null)
            {
                // Return HTTP 401 Unauthorized
                return Unauthorized(new { Message = "Category Already Exist." });
            }

            // Passed Tests -> Save to DB

            // save product to database
            try
            {
                await _dbServices.AddCategory(NewCategory);
            }
            catch (Exception)
            {

                return StatusCode(500, new { Message = "Error saving category to database." });
            }

            // try to retrieve the inserted product
            try
            {
                Category category = await _dbServices.GetCategoryByName(NewCategory.Name);
                return Ok(category);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Message = "Error retrieving category from database after insertion." });
            }
        }

        [HttpPost("usaddstore")]
        public async Task<IActionResult> UsAddStore([FromBody] NewStoreRequest NewStore)
        {
            // Basic Validation
            if (NewStore == null || string.IsNullOrEmpty(NewStore.Name))
            {
                // Return HTTP 400 Bad Request if the payload is incomplete
                return BadRequest("Product Data is Missing");
            }

            // Check Category Exists
            Store check_store = await _dbServices.GetStoreByName(NewStore.Name); // checking if null did not work...
            if (check_store != null)
            {
                // Return HTTP 401 Unauthorized
                return Unauthorized(new { Message = "Store Already Exist." });
            }

            // Passed Tests -> Save to DB

            // save product to database
            try
            {
                await _dbServices.AddStore(NewStore);
            }
            catch (Exception)
            {

                return StatusCode(500, new { Message = "Error saving Store to database." });
            }

            // try to retrieve the inserted product
            try
            {
                Category store = await _dbServices.GetCategoryByName(NewStore.Name);
                return Ok(store);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Message = "Error retrieving store from database after insertion." });
            }
        }


        // ** User Management ** - UnSave Version

        [HttpPost("usadduser")]
        public async Task<IActionResult> UsAddUser([FromBody] NewUserRequest NewUser)
        {
            // Basic Validation
            if (NewUser == null || string.IsNullOrEmpty(NewUser.Username))
            {
                // Return HTTP 400 Bad Request if the payload is incomplete
                return BadRequest("Product Data is Missing");
            }

            // Check Category Exists
            User check_user = await _dbServices.GetUserByUsername(NewUser.Username); // checking if null did not work...
            if (check_user != null)
            {
                // Return HTTP 401 Unauthorized
                return Unauthorized(new { Message = "User Already Exist." });
            }

            // Passed Tests -> Save to DB

            // save product to database
            try
            {
                await _dbServices.AddUser(NewUser);
            }
            catch (Exception)
            {

                return StatusCode(500, new { Message = "Error saving User to database." });
            }

            // try to retrieve the inserted product
            try
            {
                User user = await _dbServices.GetUserByUsername(NewUser.Username);
                return Ok(user);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Message = "Error retrieving user from database after insertion." });
            }
        }

    }
}
