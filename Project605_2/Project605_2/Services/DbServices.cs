using MySqlConnector;
using Project605_2.Models;
using System.Data;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System;

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
            Console.WriteLine("** Opening connection - ValidateLogin **");

            bool login_ok = false;
            try
            {
                using (var conn = new MySqlConnection(Builder.ConnectionString))
                {
                    await conn.OpenAsync();

                    using (var command = conn.CreateCommand())
                    {
                        command.CommandText = "SELECT * FROM users;";

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                Console.WriteLine(string.Format(
                                    "\tReading from table=({0}, {1})",
                                    reader.GetInt32(0),
                                    reader.GetString(1),
                                    reader.GetString(2)
                                    ));
                                if (user.Username == reader.GetString(1) &&
                                    user.Password == reader.GetString(2))
                                {
                                    login_ok = true;
                                }
                            }
                        }
                    }
                    Console.WriteLine("** Closing connection **");
                }
                return login_ok;
            }
            catch (Exception)
            {
                return login_ok;
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
            List<Product> newProduct = new List<Product>();
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
                                newProduct.Add(new Product
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
                return newProduct;
            }
            catch (Exception)
            {
                return newProduct;
            }
        }


        // Save to Database

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
    }
}
