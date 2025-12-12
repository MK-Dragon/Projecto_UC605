using MySqlConnector;
using Project605_2.Models;
using StackExchange.Redis;
using System;
using System.Data;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Threading.Tasks;
using static System.String;

namespace Project605_2.Services
{
    public class DbServices
    {
        // MySQL Connection Details
        private string ServerIP = "localhost";
        private int Port = 3306;
        private string DB = "YOUR-DATABASE";
        private string User = "USER";
        private string Pass = "PASSWORD";

        private MySqlConnectionStringBuilder Builder;

        // Redis Connection Details
        private int RedisPort = 6379;
        private string RedisIp = "localhost";
        private readonly IDatabase _redisDb;
        private readonly ConnectionMultiplexer _redis;
        private string RedisConnectionString = "localhost:6379,allowAdmin=true";
        private readonly TimeSpan DefaultCacheExpiration = TimeSpan.FromMinutes(1);

        //public CacheCounter CacheStats;

        /*
        Redis Cache Keys:

        all_products
        all_stores
        all_categories
        all_store_stock
         */


        public DbServices(String server, int port, String db, String user, String pass, string redisIp, int redisPort)
        {
            // MySQL
            ServerIP = server;
            Port = port;
            DB = db;
            User = user;
            Pass = pass;

            Builder = new MySqlConnectionStringBuilder
            {
                Server = this.ServerIP,
                Port = (uint)this.Port,
                Database = this.DB,
                UserID = this.User,
                Password = this.Pass,
                SslMode = MySqlSslMode.Required,
            };

            // Redis
            RedisPort = redisPort;
            RedisIp = redisIp;
            RedisConnectionString = $"{RedisIp}:{RedisPort},allowAdmin=true";


            try
            {
                _redis = ConnectionMultiplexer.Connect(RedisConnectionString);
                _redisDb = _redis.GetDatabase();
                Console.WriteLine("Redis connection established successfully.");
                //CacheStats = new CacheCounter(true);
            }
            catch (Exception ex)
            {
                // Handle or log the error if Redis connection fails
                Console.WriteLine($"Failed to connect to Redis: {ex.Message}");
                // You might want to make caching optional if the connection fails
                //CacheStats = new CacheCounter(false);
            }
        }

        // Test Method
        public async Task ReadDb(string[] args) // Prof of Concept
        {
            // not in use
            var builder = new MySqlConnectionStringBuilder
            {
                Server = this.ServerIP,
                Port = (uint)this.Port,
                Database = this.DB,
                UserID = this.User,
                Password = this.Pass,
                SslMode = MySqlSslMode.Required,
            };

            using (var conn = new MySqlConnection(builder.ConnectionString))
            {
                Console.WriteLine("Opening connection");
                await conn.OpenAsync();

                using (var command = conn.CreateCommand())
                {
                    command.CommandText = "SELECT * FROM products;";

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            Console.WriteLine(string.Format(
                                //"Reading from table=({0}, {1}, {2})",
                                "Reading from table=({0}, {1})",
                                reader.GetInt32(0),
                                reader.GetString(1)
                                //reader.GetInt32(2)
                                ));
                        }
                    }
                }

                Console.WriteLine("Closing connection");
            }

            Console.WriteLine("Read DB - Press RETURN to exit");
            //Console.ReadLine();
        }


        // --- Helper Methods for Redis ---

        // Retrieves a cached item from Redis.
        private async Task<T> GetCachedItemAsync<T>(string key) where T : class
        {
            try
            {
                if (_redisDb == null) return null;

                var cachedValue = await _redisDb.StringGetAsync(key);
                if (cachedValue.IsNullOrEmpty)
                {
                    return null; // Cache miss
                }

                // Deserialize the JSON string back into the object type T
                return JsonSerializer.Deserialize<T>(cachedValue!)!;
            }
            catch (Exception)
            {
                return null;
            }

        }

        // Sets an item in Redis with an expiration time.
        private async Task SetCachedItemAsync<T>(string key, T item, TimeSpan? expiry = null)
        {
            try
            {
                if (_redisDb == null) return;

                // Default expiration: 5 minutes (adjust as needed)
                var expiration = expiry ?? TimeSpan.FromMinutes(5);

                // Serialize the object to a JSON string
                var jsonValue = JsonSerializer.Serialize(item);

                await _redisDb.StringSetAsync(key, jsonValue, expiration);
            }
            catch (Exception)
            {
                return;
            }
        }

        // Removes a key from Redis.
        private async Task InvalidateCacheKeyAsync(string key)
        {
            try
            {
                if (_redisDb == null) return;
                await _redisDb.KeyDeleteAsync(key);
            }
            catch (Exception)
            {
                return;
            }
        }



        // Login Method

        public async Task<bool> ValidateLogin(LoginRequest user)
        {
            // Define the SQL query 
            const string sqlQuery = "SELECT COUNT(*) FROM users WHERE Username = @username AND Password = @password;";

            Console.WriteLine("** Opening connection - ValidateLogin **");
            bool loginOk = false;

            try
            {
                await using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();

                    await using (var command = conn.CreateCommand())
                    {
                        command.CommandText = sqlQuery;

                        // Add parameters to prevent SQL Injection
                        command.Parameters.AddWithValue("@username", user.Username);
                        command.Parameters.AddWithValue("@password", user.Password);

                        // ExecuteScalarAsync is best for retrieving a single value (like COUNT)
                        // It returns the first column of the first row (or null if no rows)
                        var result = await command.ExecuteScalarAsync();

                        // Check the result. If a matching row was found, COUNT(*) will be 1.
                        // We use pattern matching (C# 9+) for clean type and null check
                        if (result is long count && count > 0)
                        {
                            loginOk = true;
                            Console.WriteLine($"\tLogin successful for user: {user.Username}");
                        }
                        else
                        {
                            Console.WriteLine($"\tLogin failed for user: {user.Username}. No matching record found.");
                        }
                    }
                    Console.WriteLine("** Closing connection **");
                }
                return loginOk;
            }
            catch (Exception ex)
            {
                // 6. Log the exception details for debugging, but don't expose them to the user.
                Console.WriteLine($"\tAn error occurred during login validation: {ex.Message}");

                // In case of any database error, treat it as a failed login attempt.
                return false;
            }
        }

        public async Task<bool> ValidateToken(string username, string token)
        {
            Console.WriteLine("** Opening connection - ValidateToken **");
            try
            { 
                User user = await GetUserByUsername(username);

                if (user == null)
                {
                    Console.WriteLine("\tUser not found.");
                    return false;
                }

                if (user.Token != token)
                {
                    Console.WriteLine("\tToken mismatch.");
                    return false;
                }
                if (user.ExpiresAt == null || user.ExpiresAt < DateTime.UtcNow)
                {
                    Console.WriteLine("\tToken expired.");
                    return false;
                }

                return true;
            }
            catch (Exception)
            {
                Console.WriteLine("\tError?!.");
                return false;
            }
        }

        public async Task<bool> InvalidateToken(string username) // logout
        {
            Console.WriteLine("** Opening connection - InvalidateToken **");
            try
            {
                User user = await GetUserByUsername(username);
                if (user == null)
                {
                    Console.WriteLine("\tUser not found.");
                    return false;
                }
                user.Token = null;
                user.ExpiresAt = null;
                await UpdateUserToken(user);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }


        // Get All Data Methods

        public async Task<List<Product>> GetProducts() // Cached
        {
            List<Product> products = new List<Product>();

            string cacheKey = $"all_products";

            products = await GetCachedItemAsync<List<Product>>(cacheKey);
            if (products != null)
            {
                Console.WriteLine($"\tCache HIT for key: {cacheKey}");
                return products; // Cache HIT: Return data from Redis
            }
            else
            {
                products = new List<Product>(); // Initialize if cache miss
                Console.WriteLine($"\tCache MISS for key: {cacheKey}");
            }

            try
            {
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    Console.WriteLine("** Opening connection - Products **");
                    await conn.OpenAsync();

                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = "SELECT * FROM products;";

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                Console.WriteLine(string.Format(
                                    "\tReading from table=({0}, {1}, {2})",
                                    reader.GetInt32(0),
                                    reader.GetString(1),
                                    reader.GetInt32(2)
                                    ));
                                products.Add(new Product
                                {
                                    Id = reader.GetInt32(0),
                                    Name = reader.GetString(1),
                                    IdCategory = reader.GetInt32(2)
                                });
                            }
                        }
                    }
                    Console.WriteLine("** Closing connection **");
                }

                // Update Cache
                if (products.Count != 0)
                {
                    await SetCachedItemAsync(cacheKey, products, DefaultCacheExpiration);
                    Console.WriteLine($"\tCaching for key: {cacheKey}");
                }
                return products;
            }
            catch (Exception)
            {
                return products;
            }
        }

        public async Task<List<Store>> GetStores() // Cached
        {
            List<Store> stores = new List<Store>();

            // Check cache first
            string cacheKey = $"all_stores";
            stores = await GetCachedItemAsync<List<Store>>(cacheKey);
            if (stores != null)
            {
                Console.WriteLine($"\tCache HIT for key: {cacheKey}");
                return stores; // Cache HIT: Return data from Redis
            }
            else
            {
                stores = new List<Store>(); // Initialize if cache miss
                Console.WriteLine($"\tCache MISS for key: {cacheKey}");
            }

            // Query Database
            try
            {
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    Console.WriteLine("** Opening connection - Stores **");
                    await conn.OpenAsync();

                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = "SELECT * FROM stores;";

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                Console.WriteLine(string.Format(
                                    "\tReading from table=({0}, {1})",
                                    reader.GetInt32(0),
                                    reader.GetString(1)
                                    ));
                                stores.Add(new Store
                                {
                                    Id = reader.GetInt32(0),
                                    Name = reader.GetString(1)
                                });
                            }
                        }
                    }
                    Console.WriteLine("** Closing connection **");
                }

                // Update Cache
                if (stores.Count != 0)
                {
                    await SetCachedItemAsync(cacheKey, stores, DefaultCacheExpiration);
                    Console.WriteLine($"\tCaching for key: {cacheKey}");
                }
                return stores;
            }
            catch (Exception)
            {
                return stores;
            }
        }

        public async Task<List<Category>> GetCategories() // Cached
        {
            List<Category> categories = new List<Category>();

            // Check cache first
            string cacheKey = $"all_categories";
            categories = await GetCachedItemAsync<List<Category>>(cacheKey);
            if (categories != null)
            {
                Console.WriteLine($"\tCache HIT for key: {cacheKey}");
                return categories; // Cache HIT: Return data from Redis
            }
            else
            {
                categories = new List<Category>(); // Initialize if cache miss
                Console.WriteLine($"\tCache MISS for key: {cacheKey}");
            }

            try
            {
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    Console.WriteLine("** Opening connection - Categories **");
                    await conn.OpenAsync();

                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = "SELECT * FROM categories;";

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                Console.WriteLine(string.Format(
                                    "\tReading from table=({0}, {1})",
                                    reader.GetInt32(0),
                                    reader.GetString(1)
                                    ));
                                categories.Add(new Category
                                {
                                    Id = reader.GetInt32(0),
                                    Name = reader.GetString(1)
                                });
                            }
                        }
                    }

                    Console.WriteLine("** Closing connection **");
                }
                // Update Cache
                if (categories.Count != 0)
                {
                    await SetCachedItemAsync(cacheKey, categories, DefaultCacheExpiration);
                    Console.WriteLine($"\tCaching for key: {cacheKey}");
                }
                return categories;
            }
            catch (Exception)
            {
                return categories;
            }
        }

        public async Task<List<InventoryRequested>> GetStoreStock() // Cached
        {
            List<InventoryRequested> storeStock = new List<InventoryRequested>();

            // Check cache first
            string cacheKey = $"all_store_stock";
            storeStock = await GetCachedItemAsync<List<InventoryRequested>>(cacheKey);
            if (storeStock != null)
            {
                Console.WriteLine($"\tCache HIT for key: {cacheKey}");
                return storeStock; // Cache HIT: Return data from Redis
            }
            else
            {
                storeStock = new List<InventoryRequested>(); // Initialize if cache miss
                Console.WriteLine($"\tCache MISS for key: {cacheKey}");
            }

            try
            {
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    Console.WriteLine("** Opening connection - StoreStock **");
                    await conn.OpenAsync();

                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = @"
SELECT
    s.id AS store_id,
    s.name AS store_name,
    p.id AS product_id,
    p.name AS product_name,
    c.id AS category_id,
    c.name AS category_name,
    ss.quant AS quantity
FROM
    store_stock ss
JOIN
    stores s ON ss.id_store = s.id
JOIN
    products p ON ss.id_product = p.id
JOIN
    categories c ON p.id_category = c.id;";

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                Console.WriteLine(string.Format(
                                    "\tReading from table=({0}, {1}, {2}, {3}, {4}, {5}, {6})",
                                    reader.GetInt32(0), // IdStore
                                    reader.GetString(1), // Store Name
                                    reader.GetInt32(2), // IdProduct
                                    reader.GetString(3), // Product Name
                                    reader.GetInt32(4), // IdCategory
                                    reader.GetString(5), // Category Name
                                    reader.GetInt32(6)  // Stock
                                    ));
                                storeStock.Add(new InventoryRequested
                                {
                                    IdStore = reader.GetInt32(0),
                                    StoreName = reader.GetString(1),
                                    IdProduct = reader.GetInt32(2),
                                    ProductName = reader.GetString(3),
                                    IdCategory = reader.GetInt32(4),
                                    CategoryName = reader.GetString(5),
                                    Stock = reader.GetInt32(6)
                                });
                            }
                        }
                    }

                    Console.WriteLine("** Closing connection **");
                }
                // Update Cache
                if (storeStock.Count != 0)
                {
                    await SetCachedItemAsync(cacheKey, storeStock, DefaultCacheExpiration);
                    Console.WriteLine($"\tCaching for key: {cacheKey}");
                }
                return storeStock;
            }
            catch (Exception)
            {
                return storeStock;
            }
        }



        // Get Specific Data Methods

        public async Task<User> GetUserByUsername(string username)
        {
            Console.WriteLine("** Opening connection - GetUserByUsername **");
            User user = null; // Initialize user to null

            try
            {
                // 1. Use the correct column names from your database schema
                string sql = @"
            SELECT 
                Id, 
                username, 
                password, 
                token, 
                created_at, 
                expire_at 
            FROM users 
            WHERE username=@username;";

                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();
                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = sql;
                        command.Parameters.AddWithValue("@username", username);

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                // 2. Safely check for DBNull for nullable columns (Token, ExpiresAt)
                                string tokenValue = reader.IsDBNull("token") ? null : reader.GetString("token");
                                DateTime? expiresAtValue = reader.IsDBNull("expire_at") ? (DateTime?)null : reader.GetDateTime("expire_at");

                                Console.WriteLine($"\tFound user: {reader.GetString("username")}");

                                user = new User
                                {
                                    Id = reader.GetInt32("Id"),
                                    Username = reader.GetString("username"),
                                    Password = reader.GetString("password"),
                                    Token = tokenValue, // Use the checked value
                                    CreatedAt = reader.GetDateTime("created_at"),
                                    ExpiresAt = expiresAtValue // Use the checked value
                                };
                            }
                        }
                    }
                    Console.WriteLine("** Closing connection **");
                }
            }
            // 3. Log or handle the exception instead of swallowing it
            catch (MySqlException ex)
            {
                Console.WriteLine($"\t[ERROR] MySQL Exception: {ex.Message}");
                // Consider re-throwing or logging the exception detail
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\t[ERROR] General Exception: {ex.Message}");
            }

            return user;
        }

        public async Task<Product> GetProductByName(string ProductName)
        {
            Console.WriteLine($"** Opening connection - Product by Name [{ProductName}] **");

            // 1. Define the SQL query using a parameter for the product name
            const string sqlQuery = "SELECT id, name, id_category FROM products WHERE name = @productName LIMIT 1;";

            // Initialize the product to null or a default state (null is better for "not found")
            Product product = null;

            // Guard clause for invalid input
            if (IsNullOrEmpty(ProductName))
            {
                Console.WriteLine("\tProduct name cannot be empty.");
                return null;
            }

            try
            {
                await using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();

                    await using (var command = conn.CreateCommand())
                    {
                        command.CommandText = sqlQuery;

                        // 2. Add the parameter to prevent SQL Injection
                        // Ensure the parameter name (@productName) matches the query.
                        command.Parameters.AddWithValue("@productName", ProductName);

                        await using (var reader = await command.ExecuteReaderAsync())
                        {
                            // 3. We expect at most one row, so we just check if ReadAsync returns true once
                            if (await reader.ReadAsync())
                            {
                                // 4. Map the data to the Product object
                                product = new Product
                                {
                                    // It's generally safer to get data by column name if possible, 
                                    // but using indexes (0, 1, 2) is acceptable if you are certain of the column order.
                                    // Assuming your columns are in order: Id (0), Name (1), IdCategory (2)
                                    Id = reader.GetInt32(0),
                                    Name = reader.GetString(1),
                                    IdCategory = reader.GetInt32(2)
                                };

                                Console.WriteLine($"\tFound product: ({product.Id}, {product.Name}, {product.IdCategory})");
                            }
                            else
                            {
                                Console.WriteLine($"\tProduct with name '{ProductName}' not found.");
                            }
                        }
                    }
                    Console.WriteLine("** Closing connection **");
                }
                return product;
            }
            catch (Exception ex)
            {
                // Log the exception details for debugging
                Console.WriteLine($"\tAn error occurred while retrieving product: {ex.Message}");
                // Return null to signal that the product could not be retrieved due to an error.
                return null;
            }
        }

        public async Task<Product> GetProductById(int ProductId)
        {
            Console.WriteLine($"** Opening connection - Product by ID [{ProductId}] **");

            // 1. Define the SQL query using a parameter for the product name
            const string sqlQuery = "SELECT id, name, id_category FROM products WHERE id = @productId LIMIT 1;";

            // Initialize the product to null or a default state (null is better for "not found")
            Product product = null;

            // Guard clause for invalid input
            if (ProductId <= 0)
            {
                Console.WriteLine("\tProduct ID cannot be 0 or Negative.");
                return null;
            }

            try
            {
                await using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();

                    await using (var command = conn.CreateCommand())
                    {
                        command.CommandText = sqlQuery;

                        // 2. Add the parameter to prevent SQL Injection
                        // Ensure the parameter name (@productName) matches the query.
                        command.Parameters.AddWithValue("@productId", ProductId);

                        await using (var reader = await command.ExecuteReaderAsync())
                        {
                            // 3. We expect at most one row, so we just check if ReadAsync returns true once
                            if (await reader.ReadAsync())
                            {
                                // 4. Map the data to the Product object
                                product = new Product
                                {
                                    // It's generally safer to get data by column name if possible, 
                                    // but using indexes (0, 1, 2) is acceptable if you are certain of the column order.
                                    // Assuming your columns are in order: Id (0), Name (1), IdCategory (2)
                                    Id = reader.GetInt32(0),
                                    Name = reader.GetString(1),
                                    IdCategory = reader.GetInt32(2)
                                };

                                Console.WriteLine($"\tFound product: ({product.Id}, {product.Name}, {product.IdCategory})");
                            }
                            else
                            {
                                Console.WriteLine($"\tProduct with name '{ProductId}' not found.");
                            }
                        }
                    }
                    Console.WriteLine("** Closing connection **");
                }
                return product;
            }
            catch (Exception ex)
            {
                // Log the exception details for debugging
                Console.WriteLine($"\tAn error occurred while retrieving product: {ex.Message}");
                // Return null to signal that the product could not be retrieved due to an error.
                return null;
            }
        }

        public async Task<Category> GetCategoryById(int CategoryId)
        {
            Console.WriteLine($"** Opening connection - Category by ID [{CategoryId}] **");

            // 1. SQL Query: Select columns from 'categories' where the 'id' matches the parameter.
            const string sqlQuery = "SELECT id, name FROM categories WHERE id = @categoryId LIMIT 1;";

            // Initialize the category to null (best practice for "not found")
            Category category = null;

            // Guard clause for invalid input
            if (CategoryId <= 0)
            {
                Console.WriteLine("\tCategory ID must be a positive integer.");
                return null;
            }

            try
            {
                // Use 'await using' for automatic disposal (C# 8+)
                await using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();

                    await using (var command = conn.CreateCommand())
                    {
                        command.CommandText = sqlQuery;

                        // 2. Add the parameter to prevent SQL Injection
                        // We map the C# variable CategoryId to the SQL parameter @categoryId.
                        command.Parameters.AddWithValue("@categoryId", CategoryId);

                        await using (var reader = await command.ExecuteReaderAsync())
                        {
                            // 3. Check if a row was returned (we expect at most one)
                            if (await reader.ReadAsync())
                            {
                                // 4. Map the data to the Category object
                                category = new Category
                                {
                                    // Using column names is safer than indexes if columns change order, 
                                    // but using indexes (0, 1) is fine based on the query order.
                                    Id = reader.GetInt32(0),   // 'id' is the first column
                                    Name = reader.GetString(1) // 'name' is the second column
                                };

                                Console.WriteLine($"\tFound category: ({category.Id}, {category.Name})");
                            }
                            else
                            {
                                Console.WriteLine($"\tCategory with ID '{CategoryId}' not found.");
                            }
                        }
                    }
                    Console.WriteLine("** Closing connection **");
                }
                return category;
            }
            catch (Exception ex)
            {
                // Log the exception details for debugging
                Console.WriteLine($"\tAn error occurred while retrieving category: {ex.Message}");
                // Return null on error
                return null;
            }
        }

        public async Task<Category> GetCategoryByName(String CategoryName)
        {
            Console.WriteLine($"** Opening connection - Category by Name [{CategoryName}] **");

            // 1. SQL Query: Select columns from 'categories' where the 'id' matches the parameter.
            const string sqlQuery = "SELECT id, name FROM categories WHERE name = @categoryName LIMIT 1;";

            // Initialize the category to null (best practice for "not found")
            Category category = null;

            // Guard clause for invalid input
            if (CategoryName == null || string.IsNullOrEmpty(CategoryName))
            {
                Console.WriteLine("\tCategory ID must be a positive integer.");
                return null;
            }

            try
            {
                // Use 'await using' for automatic disposal (C# 8+)
                await using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();

                    await using (var command = conn.CreateCommand())
                    {
                        command.CommandText = sqlQuery;

                        // 2. Add the parameter to prevent SQL Injection
                        // We map the C# variable CategoryId to the SQL parameter @categoryId.
                        command.Parameters.AddWithValue("@categoryName", CategoryName);

                        await using (var reader = await command.ExecuteReaderAsync())
                        {
                            // 3. Check if a row was returned (we expect at most one)
                            if (await reader.ReadAsync())
                            {
                                // 4. Map the data to the Category object
                                category = new Category
                                {
                                    // Using column names is safer than indexes if columns change order, 
                                    // but using indexes (0, 1) is fine based on the query order.
                                    Id = reader.GetInt32(0),   // 'id' is the first column
                                    Name = reader.GetString(1) // 'name' is the second column
                                };

                                Console.WriteLine($"\tFound category: ({category.Id}, {category.Name})");
                            }
                            else
                            {
                                Console.WriteLine($"\tCategory with ID '{CategoryName}' not found.");
                            }
                        }
                    }
                    Console.WriteLine("** Closing connection **");
                }
                return category;
            }
            catch (Exception ex)
            {
                // Log the exception details for debugging
                Console.WriteLine($"\tAn error occurred while retrieving category: {ex.Message}");
                // Return null on error
                return null;
            }
        }

        public async Task<StoreStock> GetStoreStockById(int id_store, int id_product)
        {
            Console.WriteLine($"** Opening connection - Store Stock S[{id_store}] P[{id_product}] **");

            // 1. SQL Query: Select columns from 'categories' where the 'id' matches the parameter.
            const string sqlQuery = "SELECT id_store, id_product, quant FROM store_stock WHERE id_product = @id_product AND id_store = @id_store LIMIT 1;";

            // Initialize the category to null (best practice for "not found")
            StoreStock store_stock = null;

            // Guard clause for invalid input
            if (id_store <= 0 || id_product <= 0)
            {
                Console.WriteLine("\tStore and Product ID must be a positive integer.");
                return null;
            }

            try
            {
                // Use 'await using' for automatic disposal (C# 8+)
                await using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();

                    await using (var command = conn.CreateCommand())
                    {
                        command.CommandText = sqlQuery;

                        // 2. Add the parameter to prevent SQL Injection
                        // We map the C# variable CategoryId to the SQL parameter @categoryId.
                        command.Parameters.AddWithValue("@id_product", id_product);
                        command.Parameters.AddWithValue("@id_store", id_store);

                        await using (var reader = await command.ExecuteReaderAsync())
                        {
                            // 3. Check if a row was returned (we expect at most one)
                            if (await reader.ReadAsync())
                            {
                                // 4. Map the data to the Category object
                                store_stock = new StoreStock
                                {
                                    // Using column names is safer than indexes if columns change order, 
                                    // but using indexes (0, 1) is fine based on the query order.
                                    IdStore = reader.GetInt32(0),   // 'id' is the first column
                                    IdProduct = reader.GetInt32(0),   // 'id' is the first column
                                    Stock = reader.GetInt32(0),   // 'id' is the first column
                                };

                                Console.WriteLine($"\tFound Store Stock: S{store_stock.IdStore}, P{store_stock.IdProduct}");
                            }
                            else
                            {
                                Console.WriteLine($"\tStore Stock with ID '(S{id_store}, P{id_product})' not found.");
                            }
                        }
                    }
                    Console.WriteLine("** Closing connection **");
                }
                return store_stock;
            }
            catch (Exception ex)
            {
                // Log the exception details for debugging
                Console.WriteLine($"\tAn error occurred while retrieving category: {ex.Message}");
                // Return null on error
                return null;
            }
        }



        // Update Data Methods

        public async Task UpdateUserToken(User user)
        {
            Console.WriteLine("** Opening connection - UpdateUserToken **");
            try
            {
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();
                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = "UPDATE users SET token=@token, expire_at=@expire_at WHERE username=@username;";
                        command.Parameters.AddWithValue("@token", user.Token);
                        command.Parameters.AddWithValue("@expire_at", user.ExpiresAt);
                        command.Parameters.AddWithValue("@created_at", user.CreatedAt);
                        command.Parameters.AddWithValue("@username", user.Username);
                        int rowsAffected = await command.ExecuteNonQueryAsync();
                        Console.WriteLine($"\tRows affected: {rowsAffected}");
                    }
                }
                Console.WriteLine("** Closing connection **");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating user token: {ex.Message}");
            }
        }

        public async Task UpdateStoreStock(StoreStock upStock) // Clear Cache
        {
            Console.WriteLine("** Opening connection - UpdateStoreStock **");
            try
            {
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();
                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = "UPDATE store_stock SET quant = @quant WHERE id_product = @id_product AND id_store = @id_store;";
                        command.Parameters.AddWithValue("@quant", upStock.Stock);
                        command.Parameters.AddWithValue("@id_product", upStock.IdProduct);
                        command.Parameters.AddWithValue("@id_store", upStock.IdStore);
                        int rowsAffected = await command.ExecuteNonQueryAsync();
                        Console.WriteLine($"\tRows affected: {rowsAffected}");
                    }
                }
                Console.WriteLine("** Closing connection **");
                await InvalidateCacheKeyAsync("all_store_stock");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating Store Stock (Inverntory): {ex.Message}");
            }
        }

        public async Task UpdateProduct(Product upProduct) // Clear Cache
        {
            Console.WriteLine("** Opening connection - UpdateProduct **");
            try
            {
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();
                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = "UPDATE products SET name = @name, id_category = @id_category WHERE id = @id_product;";
                        command.Parameters.AddWithValue("@id_product", upProduct.Id);
                        command.Parameters.AddWithValue("@name", upProduct.Name);
                        command.Parameters.AddWithValue("@id_category", upProduct.IdCategory);
                        int rowsAffected = await command.ExecuteNonQueryAsync();
                        Console.WriteLine($"\tRows affected: {rowsAffected}");
                    }
                }
                Console.WriteLine("** Closing connection **");
                await InvalidateCacheKeyAsync("all_products");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating Product: {ex.Message}");
            }
        }

        public async Task UpdateCategory(Category upCategory) // Clear Cache
        {
            Console.WriteLine("** Opening connection - UpdateCategory **");
            try
            {
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();
                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = "UPDATE categories SET name = @name WHERE id = @id_category;";
                        command.Parameters.AddWithValue("@id_category", upCategory.Id);
                        command.Parameters.AddWithValue("@name", upCategory.Name);
                        int rowsAffected = await command.ExecuteNonQueryAsync();
                        Console.WriteLine($"\tRows affected: {rowsAffected}");
                    }
                }
                Console.WriteLine("** Closing connection **");
                await InvalidateCacheKeyAsync("all_categories");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating Category: {ex.Message}");
            }
        }



        // Insert Data Methods

        public async Task AddProduct(NewProductRequest product) // Clear Cache
        {
            Console.WriteLine("** Opening connection - AddProduct **");

            // 1. Define the SQL INSERT statement
            // We are inserting into 'products' and specifying 'name' and 'id_category'.
            // We use parameters (@name, @id_category) to prevent SQL injection.
            const string insertSql =
                "INSERT INTO products (name, id_category) " +
                "VALUES (@name, @id_category);";

            try
            {
                // Assuming 'Builder.ConnectionString' is accessible and correct
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();
                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = insertSql;

                        // 2. Map the Product C# properties to the SQL parameters
                        command.Parameters.AddWithValue("@name", product.Name);
                        command.Parameters.AddWithValue("@id_category", product.IdCategory);

                        // 3. Execute the command
                        int rowsAffected = await command.ExecuteNonQueryAsync();

                        Console.WriteLine($"\tProduct '{product.Name}' inserted. Rows affected: {rowsAffected}");
                    }
                }
                Console.WriteLine("** Closing connection **");
                await InvalidateCacheKeyAsync("all_products");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inserting product: {ex.Message}");
                // Optionally re-throw the exception if the caller needs to handle failure
                // throw;
            }
        }

        public async Task AddCategory(NewCategoryRequest category) // Clear Cache
        {
            Console.WriteLine("** Opening connection - AddProduct **");

            // 1. Define the SQL INSERT statement
            // We are inserting into 'products' and specifying 'name' and 'id_category'.
            // We use parameters (@name, @id_category) to prevent SQL injection.
            const string insertSql =
                "INSERT INTO categories (name) " +
                "VALUES (@name);";

            try
            {
                // Assuming 'Builder.ConnectionString' is accessible and correct
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();
                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = insertSql;

                        // 2. Map the Product C# properties to the SQL parameters
                        command.Parameters.AddWithValue("@name", category.Name);

                        // 3. Execute the command
                        int rowsAffected = await command.ExecuteNonQueryAsync();

                        Console.WriteLine($"\nCategory '{category.Name}' inserted. Rows affected: {rowsAffected}");
                    }
                }
                Console.WriteLine("** Closing connection **");
                await InvalidateCacheKeyAsync("all_categories");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inserting product: {ex.Message}");
                // Optionally re-throw the exception if the caller needs to handle failure
                // throw;
            }
        }

        public async Task AddStoreStock(StoreStock storeStock) // Clear Cache
        {
            Console.WriteLine("** Opening connection - AddProduct **");

            // 1. Define the SQL INSERT statement
            // We are inserting into 'products' and specifying 'name' and 'id_category'.
            // We use parameters (@name, @id_category) to prevent SQL injection.
            const string insertSql =
                "INSERT INTO store_stock (id_store, id_product, quant) " +
                "VALUES (@id_store, @id_product, @quant);";

            try
            {
                // Assuming 'Builder.ConnectionString' is accessible and correct
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();
                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = insertSql;

                        // 2. Map the Product C# properties to the SQL parameters
                        command.Parameters.AddWithValue("@id_store", storeStock.IdStore);
                        command.Parameters.AddWithValue("@id_product", storeStock.IdProduct);
                        command.Parameters.AddWithValue("@quant", storeStock.Stock);

                        // 3. Execute the command
                        int rowsAffected = await command.ExecuteNonQueryAsync();

                        Console.WriteLine($"\tStore Stock: '(S{storeStock.IdStore}, P{storeStock.IdProduct}, Q{storeStock.Stock})' inserted. Rows affected: {rowsAffected}");
                    }
                }
                Console.WriteLine("** Closing connection **");
                await InvalidateCacheKeyAsync("all_store_stock");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inserting store stock: {ex.Message}");
                // Optionally re-throw the exception if the caller needs to handle failure
                // throw;
            }
        }



    }
}
