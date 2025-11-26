using MySqlConnector;
using Project605_2.Models;
using System.Runtime.CompilerServices;

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
    }
}
