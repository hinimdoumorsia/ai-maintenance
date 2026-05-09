import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { KpiStat } from "../types";

interface StatsCardProps {
  stat: KpiStat;
  icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ stat, icon }) => {
  const iconClass = `stat-icon stat-icon-${stat.color}`;
  const trendClass =
    stat.trend === undefined ? "" :
    stat.trend > 0 ? "trend-up" :
    stat.trend < 0 ? "trend-down" : "trend-neutral";

  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className={iconClass}>{icon}</div>
      </div>
      <div className="stat-value">
        {stat.value}
        {stat.unit && <span style={{ fontSize: 14, fontWeight: 500, color: "#6b7280", marginLeft: 3 }}>{stat.unit}</span>}
      </div>
      <div className="stat-label">{stat.label}</div>
      {stat.trend !== undefined && (
        <div className={`stat-trend ${trendClass}`}>
          {stat.trend > 0 ? <TrendingUp size={12} /> : stat.trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
          <span>{Math.abs(stat.trend)}% {stat.trendLabel || ""}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
