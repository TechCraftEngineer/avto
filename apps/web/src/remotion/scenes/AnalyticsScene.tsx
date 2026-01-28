"use client";

import { AbsoluteFill, interpolate } from "remotion";

interface SceneProps {
  frame: number;
}

export const AnalyticsScene: React.FC<SceneProps> = ({ frame }) => {
  const titleOpacity = interpolate(frame, [0, 15], [0, 1]);

  // Реальные метрики для IT-рекрутинга в РФ (данные 2025-2026)
  const metrics = [
    { 
      label: "Время закрытия вакансии", 
      value: "18", 
      unit: "дней",
      change: "-40%",
      trend: "down", 
      color: "#10b981",
      benchmark: "Было: 30 дней"
    },
    { 
      label: "Стоимость найма", 
      value: "42 000", 
      unit: "₽",
      change: "-40%",
      trend: "down", 
      color: "#10b981",
      benchmark: "Было: 70 000 ₽"
    },
    { 
      label: "Конверсия в приём", 
      value: "5.6", 
      unit: "%",
      change: "+75%",
      trend: "up", 
      color: "#3b82f6",
      benchmark: "Было: 3.2%"
    },
    { 
      label: "Удержание 6 мес", 
      value: "92", 
      unit: "%",
      change: "+9%",
      trend: "up", 
      color: "#8b5cf6",
      benchmark: "Было: 84%"
    },
  ];

  // Реальная воронка найма для IT (все % от начального количества)
  const funnel = [
    { label: "Отклики", value: 342, percent: 100 },
    { label: "Отбор", value: 178, percent: 52 },
    { label: "Тех. интервью", value: 71, percent: 21 },
    { label: "Финал", value: 32, percent: 9 },
    { label: "Предложение", value: 19, percent: 5.6 },
    { label: "Выход", value: 14, percent: 4.1 },
  ];

  // Источники кандидатов
  const sources = [
    { name: "hh.ru", value: 45, color: "#ef4444" },
    { name: "Телеграм", value: 28, color: "#3b82f6" },
    { name: "Рекомендации", value: 15, color: "#10b981" },
    { name: "LinkedIn", value: 12, color: "#0077b5" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: 60,
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 60,
          opacity: titleOpacity,
        }}
      >
        <h1
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "white",
            margin: 0,
          }}
        >
          Аналитика рекрутинга
        </h1>
        <p
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.6)",
            margin: "8px 0 0 0",
          }}
        >
          Январь 2026 • ООО «ТехноСофт» • IT-направление
        </p>
      </div>

      {/* Метрики */}
      <div
        style={{
          position: "absolute",
          top: 170,
          left: 60,
          right: 60,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
        }}
      >
        {metrics.map((metric, i) => {
          const delay = i * 20;
          const opacity = interpolate(frame, [delay, delay + 20], [0, 1]);
          const scale = interpolate(frame, [delay, delay + 20], [0.9, 1]);

          return (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 24,
                opacity,
                transform: `scale(${scale})`,
              }}
            >
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
                {metric.label}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "white" }}>
                  {metric.value}
                </span>
                <span style={{ fontSize: 16, color: "rgba(255,255,255,0.6)" }}>
                  {metric.unit}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: metric.color,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  {metric.trend === "up" ? "↑" : "↓"} {metric.change}
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  {metric.benchmark}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Нижняя часть - воронка и источники */}
      <div style={{
        position: "absolute",
        bottom: 60,
        left: 60,
        right: 60,
        display: "flex",
        gap: 24,
      }}>
        {/* Воронка найма */}
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 24,
            opacity: interpolate(frame, [100, 120], [0, 1]),
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 20 }}>
            Воронка найма • Senior Python Developer
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 200 }}>
            {funnel.map((stage, i) => {
              const delay = 120 + i * 15;
              const height = interpolate(frame, [delay, delay + 25], [0, stage.percent], { extrapolateRight: "clamp" });
              const colors = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#10b981", "#059669"];

              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ 
                    fontSize: 14, 
                    color: "white", 
                    fontWeight: 700, 
                    marginBottom: 4,
                    opacity: interpolate(frame, [delay + 10, delay + 25], [0, 1]),
                  }}>
                    {stage.value}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: `${height * 1.8}px`,
                      background: `linear-gradient(180deg, ${colors[i]} 0%, ${colors[i]}80 100%)`,
                      borderRadius: "8px 8px 0 0",
                      minHeight: 8,
                    }}
                  />
                  <div style={{ 
                    fontSize: 12, 
                    color: "rgba(255,255,255,0.6)", 
                    marginTop: 8,
                    textAlign: "center",
                  }}>
                    {stage.label}
                  </div>
                  <div style={{ 
                    fontSize: 11, 
                    color: "rgba(255,255,255,0.4)",
                  }}>
                    {stage.percent}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Источники кандидатов */}
        <div
          style={{
            width: 320,
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 24,
            opacity: interpolate(frame, [180, 200], [0, 1]),
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 20 }}>
            Источники кандидатов
          </div>
          {sources.map((source, i) => {
            const delay = 200 + i * 15;
            const width = interpolate(frame, [delay, delay + 20], [0, source.value], { extrapolateRight: "clamp" });
            
            return (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  marginBottom: 6,
                }}>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{source.name}</span>
                  <span style={{ fontSize: 14, color: source.color, fontWeight: 600 }}>{Math.round(width)}%</span>
                </div>
                <div style={{
                  height: 8,
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${width}%`,
                    background: source.color,
                    borderRadius: 4,
                  }} />
                </div>
              </div>
            );
          })}
          
          {/* Итого */}
          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            opacity: interpolate(frame, [260, 270], [0, 1]),
          }}>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
              Всего кандидатов за месяц
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "white" }}>
              342 <span style={{ fontSize: 14, color: "#10b981", fontWeight: 600 }}>+18% к пред. мес.</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
