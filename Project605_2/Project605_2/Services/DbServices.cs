using MySqlConnector;
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
        

        public DbServices(String server, int port, String db, String user, String pass)
        {
            ServerIP = server;
            Port = port;
            DB = db;
            User = user;
            Pass = pass;
        }


        public async Task ReadDb(string[] args)
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
    }
}
