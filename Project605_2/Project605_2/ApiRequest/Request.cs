namespace Project605_2.ApiRequest
{
    public class Request
    {
        private readonly HttpClient _Client;
        public Request(HttpClient client)
        {
            _Client = client;
        }

        public async Task<T?> GetMarcasAsync<T>(string endpoint)
        {
            var response = await _Client.GetAsync(endpoint);
            return await response.Content.ReadFromJsonAsync <T>();
        }
    }
}
