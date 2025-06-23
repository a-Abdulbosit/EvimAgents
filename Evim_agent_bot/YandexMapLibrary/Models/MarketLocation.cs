using System;

namespace Evim_agent_bot.YandexMapLibrary.Models
{
    public enum PartnerStatus
    {
        New = 0,
        Active = 1,
        NotActive = 2
    }

    public class MarketLocation
    {
        public long TelegramUserId { get; set; }
        public string AgentName { get; set; } = string.Empty;
        public string MarketNumber { get; set; } = string.Empty;
        public string MarketName { get; set; } = string.Empty;
        public string? Notes { get; set; }

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public PartnerStatus Status { get; set; } = PartnerStatus.New;
        public long? ClientId { get; set; }
        public decimal? TotalUsd { get; set; }
    }
}
