using Project605_2.Models;
using Project605_2.ApiRequest;

namespace Project605_2.Services
{
    public class ApiService
    {
        private readonly Request _request;

        public ApiService(HttpClient client)
        {
            _request = new Request(client);
        }
        public async Task<MarcasResponse> GetMarcas()
        {
            var response = await _request.GetMarcasAsync<MarcasResponse>("/api/marcas");
            return response;
        }

        public async Task<ModelosResponse> GetModelos()
        {
            var response = await _request.GetMarcasAsync<ModelosResponse>("/api/modelos");
            return response;
        }
    }
}
