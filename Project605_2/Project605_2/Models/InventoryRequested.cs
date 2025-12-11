namespace Project605_2.Models
{
    public class InventoryRequested
    {
        public int IdStore { get; set; }
        public string StoreName { get; set; }

        public int IdProduct { get; set; }
        public string ProductName { get; set; }

        public int IdCategory { get; set; }
        public string CategoryName { get; set; }

        public int Stock { get; set; }
    }
}
