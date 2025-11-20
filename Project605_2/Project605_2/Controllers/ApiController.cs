using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Project605_2.Models;
using Project605_2.Services;

namespace Project605_2.Controllers
{
    [Route("api/")]
    [ApiController]
    public class ApiController : ControllerBase
    {
        private readonly ApiService _service;
        public ApiController(ApiService service)
        {
            _service = service;
        }

        [HttpGet("getmarcas")]
        public async Task<IActionResult> GetMarcas()
        {
            /*var result = new MarcasResponse
            {
                Marcas = new List<string> { "Toyota", "Audi", "Ford", "Volvo", "Honda" }
            };*/
            
            var result = await _service.GetMarcas();

            return Ok(result);
        }

        [HttpGet("getmodelos")]
        public async Task<IActionResult> GetModelos()
        {
            var result = await _service.GetModelos();

            return Ok(result);
        }
    }
}
