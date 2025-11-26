using Project605_2.Models;
using Project605_2.ApiRequest;

namespace Project605_2.Services
{
    public class ApiService
    {
        private readonly Request _request;
        private readonly DbServices _dbServices;

        public ApiService(HttpClient client)
        {
            _request = new Request(client);
            /*_dbServices = new DbServices(
                "192.168.0.30",
                3306,
                "world",
                "rest_user",
                "123"
                );*/
            _dbServices = new DbServices(
                "192.168.0.30",
                3333,
                "Logistica_605Forte",
                "root",
                "123"
                );
        }
        public async Task<MarcasResponse> GetMarcas()
        {
            var response = await _request.GetMarcasAsync<MarcasResponse>("/api/marcas");
            await _dbServices.ReadDb(["Lol", "Hello"]);
            return response;
        }

        public async Task<ModelosResponse> GetModelos()
        {
            var response = await _request.GetMarcasAsync<ModelosResponse>("/api/modelos");
            return response;
        }
    }
}
