namespace Project605_2.Models
{
    public class CacheCounter
    {
        /*
         Just a Nice Class Make some Statistics about Cache Usage ^_^
         */

        public int CallCount { get; set; } = 0;
        public int CacheHitCount { get; set; } = 0;
        public bool RedisStatus { get; set; } = false;
        public int CacheHitPercentage
        {
            get
            {
                if (CallCount == 0)
                {
                    return 0;
                }
                return (int)((double)CacheHitCount / CallCount * 100);
            }
        }


        public CacheCounter(bool redisStatus = false)
        {
            RedisStatus = redisStatus;
            CallCount = 0;
            CacheHitCount = 0;
        }


        public void CacheHit()
        {
            CallCount++;
            CacheHitCount++;
            PrintStatistics();
        }
        public void CacheMiss()
        {
            CallCount++;
        }
        public void PrintStatistics()
        {
            System.Console.WriteLine($"!! Redis Status: {RedisStatus} !!\nCache Statistics: Calls = {CallCount}, Hits = {CacheHitCount}, Hit Percentage = {CacheHitPercentage}%");
        }
    }
}
