using MySqlConnector;
using Project605_2.Models;
using System.Data;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System;
using static System.String;

namespace Project605_2.Services
{
    public class DbServices
    {
        private string ServerIP = "localhost";
        private int Port = 3306;
        private string DB = "YOUR-DATABASE";
        private string User = "USER";
        private string Pass = "PASSWORD";

        private MySqlConnectionStringBuilder Builder;


        public DbServices(String server, int port, String db, String user, String pass)
        {
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
        }

        // Test Method
        public async Task ReadDb(string[] args) // Prof of Concept
        {
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

        public async Task<List<Product>> GetProducts()
        {
            Console.WriteLine("** Opening connection - Products **");
            List<Product> products = new List<Product>();
            try
            {
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
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
                return products;
            }
            catch (Exception)
            {
                return products;
            }
        }

        public async Task<List<Store>> GetStores()
        {
            List<Store> stores = new List<Store>();
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
                return stores;
            }
            catch (Exception)
            {
                return stores;
            }
        }

        public async Task<List<Category>> GetCategories()
        {
            List<Category> categories = new List<Category>();
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
                return categories;
            }
            catch (Exception)
            {
                return categories;
            }
        }

        public async Task<List<StoreStock>> GetStoreStock()
        {
            List<StoreStock> storeStock = new List<StoreStock>();
            try
            {
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    Console.WriteLine("** Opening connection - StoreStock **");
                    await conn.OpenAsync();

                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = "SELECT * FROM store_stock;";

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                Console.WriteLine(string.Format(
                                    "\tReading from table=({0}, {1}, {2})",
                                    reader.GetInt32(0),
                                    reader.GetInt32(1),
                                    reader.GetInt32(2)
                                    ));
                                storeStock.Add(new StoreStock
                                {
                                    IdStore = reader.GetInt32(0),
                                    IdProduct = reader.GetInt32(1),
                                    Stock = reader.GetInt32(2)
                                });
                            }
                        }
                    }

                    Console.WriteLine("** Closing connection **");
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

        public async Task UpdateStoreStock(StoreStock upStock)
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
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating Store Stock (Inverntory): {ex.Message}");
            }
        }


        // Insert Data Methods

        public async Task AddProduct(NewProductRequest product)
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
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inserting product: {ex.Message}");
                // Optionally re-throw the exception if the caller needs to handle failure
                // throw;
            }
        }

        public async Task AddCategory(NewCategoryRequest category)
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
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inserting product: {ex.Message}");
                // Optionally re-throw the exception if the caller needs to handle failure
                // throw;
            }
        }

        public async Task AddStoreStock(StoreStock storeStock)
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
