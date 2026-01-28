"use client";

import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";

interface SceneProps {
  frame: number;
}

export const DashboardScene: React.FC<SceneProps> = ({ frame }) => {
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200, mass: 0.5 },
  });

  const titleOpacity = interpolate(frame, [0, 15], [0, 1]);
  const cardsDelay = [0, 5, 10, 15];

  // Реальные данные для среднего IT-рекрутинга в РФ
  const weeklyData = [
    { day: "Пн", applications: 47, interviews: 8 },
    { day: "Вт", applications: 62, interviews: 12 },
    { day: "Ср", applications: 58, interviews: 10 },
    { day: "Чт", applications: 71, interviews: 14 },
    { day: "Пт", applications: 53, interviews: 9 },
    { day: "Сб", applications: 24, interviews: 3 },
    { day: "Вс", applications: 18, interviews: 2 },
  ];

  const maxApplications = Math.max(...weeklyData.map(d => d.applications));

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
        padding: 60,
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 60,
          opacity: titleOpacity,
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            margin: 0,
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          Панель управления
        </h1>
        <p
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.7)",
            margin: "10px 0 0 0",
          }}
        >
          Январь 2026 • ООО «ТехноСофт»
        </p>
      </div>

      {/* Карточки метрик - реальные данные для IT-компании */}
      <div
        style={{
          position: "absolute",
          top: 220,
          left: 60,
          right: 60,
          display: "flex",
          gap: 24,
        }}
      >
        {[
          { label: "Открытых вакансий", value: "17", subtext: "+3 за неделю", color: "#10b981", icon: "📋" },
          { label: "В воронке", value: "342", subtext: "кандидатов", color: "#3b82f6", icon: "👥" },
          { label: "Собеседований", value: "23", subtext: "на этой неделе", color: "#f59e0b", icon: "🎯" },
          { label: "Закрыто вакансий", value: "8", subtext: "за январь", color: "#8b5cf6", icon: "✅" },
        ].map((card, i) => {
          const cardOpacity = interpolate(
            frame,
            [cardsDelay[i] * 3, cardsDelay[i] * 3 + 15],
            [0, 1]
          );
          const cardY = interpolate(
            frame,
            [cardsDelay[i] * 3, cardsDelay[i] * 3 + 15],
            [40, 0]
          );

          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 28,
                opacity: cardOpacity,
                transform: `translateY(${cardY}px) scale(${scale})`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div
                    style={{
                      fontSize: 56,
                      fontWeight: 800,
                      color: card.color,
                      marginBottom: 4,
                      lineHeight: 1,
                    }}
                  >
                    {card.value}
                  </div>
                  <div style={{ fontSize: 18, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                    {card.subtext}
                  </div>
                </div>
                <div style={{ fontSize: 32 }}>{card.icon}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* График откликов за неделю */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 60,
          width: "55%",
          height: 280,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: 24,
          opacity: interpolate(frame, [60, 80], [0, 1]),
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 600, color: "white", marginBottom: 8 }}>
          Отклики за неделю
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
          Всего: 333 отклика • Среднее: 47/день
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160 }}>
          {weeklyData.map((day, i) => {
            const barHeight = (day.applications / maxApplications) * 100;
            const animatedHeight = interpolate(frame, [80 + i * 8, 110 + i * 8], [0, barHeight], { extrapolateRight: "clamp" });
            
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: 14, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>
                  {Math.round(interpolate(frame, [80 + i * 8, 110 + i * 8], [0, day.applications], { extrapolateRight: "clamp" }))}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: `${animatedHeight}%`,
                    background: "linear-gradient(180deg, #10b981 0%, #059669 100%)",
                    borderRadius: 6,
                    minHeight: 4,
                  }}
                />
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
                  {day.day}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Мини-статистика справа */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 60,
          width: "35%",
          height: 280,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: 24,
          opacity: interpolate(frame, [100, 120], [0, 1]),
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 600, color: "white", marginBottom: 20 }}>
          Топ вакансии
        </div>
        {[
          { title: "Senior Python Developer", responses: 89, salary: "от 350 000 ₽" },
          { title: "DevOps Engineer", responses: 67, salary: "от 280 000 ₽" },
          { title: "Product Manager", responses: 54, salary: "от 250 000 ₽" },
          { title: "Frontend React", responses: 48, salary: "от 220 000 ₽" },
        ].map((vacancy, i) => {
          const itemOpacity = interpolate(frame, [120 + i * 15, 135 + i * 15], [0, 1]);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.1)" : "none",
                opacity: itemOpacity,
              }}
            >
              <div>
                <div style={{ fontSize: 15, color: "white", fontWeight: 500 }}>{vacancy.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{vacancy.salary}</div>
              </div>
              <div style={{ fontSize: 14, color: "#3b82f6", fontWeight: 600 }}>
                {vacancy.responses} откликов
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
