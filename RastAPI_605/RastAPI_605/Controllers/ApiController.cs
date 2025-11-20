using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace RastAPI_605.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ApiController : ControllerBase
    {
        [HttpGet]
        public void GetProducts()
        {
            //return Ok(new { Message = "Hello from API Controller!" });
        }
    }
}
