"use client";

import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";

interface SceneProps {
  frame: number;
}

export const InterviewScene: React.FC<SceneProps> = ({ frame }) => {
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1]);

  // Реальный диалог AI-интервью для Python разработчика
  const messages = [
    { 
      type: "ai", 
      text: "Расскажите о вашем опыте работы с высоконагруженными системами. Какой максимальный RPS обрабатывали?",
      time: "14:32"
    },
    { 
      type: "user", 
      text: "В Яндексе работал над сервисом с 50k RPS. Использовали Python + asyncio, Redis для кэширования, PostgreSQL с партиционированием.",
      time: "14:33"
    },
    { 
      type: "ai", 
      text: "Отлично! Как решали проблему N+1 запросов в Django ORM? Приведите пример из практики.",
      time: "14:34"
    },
    { 
      type: "user", 
      text: "Использовал select_related и prefetch_related. В сложных случаях — raw SQL или переход на SQLAlchemy Core для критичных участков.",
      time: "14:35"
    },
  ];

  // Оценки по результатам интервью
  const scores = [
    { label: "Технические знания", score: 92 },
    { label: "Опыт архитектуры", score: 88 },
    { label: "Коммуникация", score: 85 },
    { label: "Решение проблем", score: 90 },
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
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          opacity: titleOpacity,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "white",
              margin: 0,
            }}
          >
            AI-собеседование
          </h1>
          <p
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.6)",
              margin: "8px 0 0 0",
            }}
          >
            Алексей Смирнов • Senior Python Developer • Техническое собеседование
          </p>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          background: "rgba(239, 68, 68, 0.2)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: 8,
          opacity: interpolate(frame, [20, 35], [0, 1]),
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#ef4444",
            animation: "pulse 2s infinite",
          }} />
          <span style={{ color: "#ef4444", fontSize: 14, fontWeight: 600 }}>REC</span>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>23:45</span>
        </div>
      </div>

      {/* Основной контент */}
      <div style={{
        position: "absolute",
        top: 170,
        left: 60,
        right: 60,
        display: "flex",
        gap: 30,
      }}>
        {/* Чат интерфейс */}
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            padding: 24,
            opacity: interpolate(frame, [20, 40], [0, 1]),
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Заголовок чата */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              paddingBottom: 20,
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              🤖
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>
              QBS Ассистент
              </div>
              <div style={{ fontSize: 14, color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                Слушает
              </div>
            </div>
          </div>

          {/* Сообщения */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            {messages.map((msg, i) => {
              const delay = 40 + i * 45;
              const opacity = interpolate(frame, [delay, delay + 20], [0, 1]);
              const y = interpolate(frame, [delay, delay + 20], [20, 0]);

              const scale = spring({
                frame: Math.max(0, frame - delay),
                fps,
                config: { damping: 100, stiffness: 200 },
              });

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.type === "ai" ? "flex-start" : "flex-end",
                    opacity,
                    transform: `translateY(${y}px) scale(${scale})`,
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "14px 18px",
                      borderRadius: msg.type === "ai" ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
                      background:
                        msg.type === "ai"
                          ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.2) 100%)"
                          : "rgba(255,255,255,0.1)",
                      border: msg.type === "ai" 
                        ? "1px solid rgba(139, 92, 246, 0.3)"
                        : "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      fontSize: 15,
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.text}
                  </div>
                  <div style={{ 
                    fontSize: 12, 
                    color: "rgba(255,255,255,0.4)", 
                    marginTop: 4,
                    paddingLeft: msg.type === "ai" ? 4 : 0,
                    paddingRight: msg.type === "user" ? 4 : 0,
                  }}>
                    {msg.time}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Индикатор печати */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              opacity: interpolate(frame, [220, 240], [0, 1]),
            }}
          >
            <div style={{ 
              padding: "10px 16px",
              background: "rgba(139, 92, 246, 0.2)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#8b5cf6",
                    opacity: interpolate(
                      (frame + i * 5) % 30,
                      [0, 15, 30],
                      [0.3, 1, 0.3]
                    ),
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              AI формулирует следующий вопрос...
            </span>
          </div>
        </div>

        {/* Правая панель - оценки */}
        <div style={{ width: 340, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Live оценки */}
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: 24,
              opacity: interpolate(frame, [100, 120], [0, 1]),
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 20 }}>
              Оценка в реальном времени
            </div>
            {scores.map((item, i) => {
              const delay = 120 + i * 20;
              const progress = interpolate(frame, [delay, delay + 30], [0, item.score], { extrapolateRight: "clamp" });
              
              return (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    marginBottom: 6,
                    fontSize: 14,
                  }}>
                    <span style={{ color: "rgba(255,255,255,0.8)" }}>{item.label}</span>
                    <span style={{ color: "#10b981", fontWeight: 600 }}>{Math.round(progress)}%</span>
                  </div>
                  <div style={{
                    height: 6,
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                      borderRadius: 3,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ключевые моменты */}
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: 24,
              opacity: interpolate(frame, [200, 220], [0, 1]),
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 16 }}>
              Ключевые моменты
            </div>
            {[
            { icon: "✓", text: "Опыт высоких нагрузок (50k RPS)", color: "#10b981" },
              { icon: "✓", text: "Знание оптимизации ORM", color: "#10b981" },
              { icon: "✓", text: "Работа в крупных компаниях", color: "#10b981" },
            ].map((item, i) => {
              const opacity = interpolate(frame, [220 + i * 15, 235 + i * 15], [0, 1]);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    opacity,
                  }}
                >
                  <span style={{ color: item.color, fontSize: 16 }}>{item.icon}</span>
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
