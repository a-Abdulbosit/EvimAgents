using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace YandexMapLibrary.Models
{
    namespace YandexMapLibrary.Models
    {
        public class MarketLocation
        {
            public long TelegramUserId { get; set; }   // agent's telegram ID
            public string AgentName { get; set; } = string.Empty;

            public string MarketName { get; set; } = string.Empty;
            public string? Notes { get; set; }  

            public double Latitude { get; set; }
            public double Longitude { get; set; }

            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        }
    }

}
