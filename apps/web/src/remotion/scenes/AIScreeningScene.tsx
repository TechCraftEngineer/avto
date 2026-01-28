"use client";

import { AbsoluteFill, interpolate } from "remotion";

interface SceneProps {
  frame: number;
}

export const AIScreeningScene: React.FC<SceneProps> = ({ frame }) => {
  const titleOpacity = interpolate(frame, [0, 15], [0, 1]);

  // Реальные навыки для Senior Python Developer
  const technicalSkills = [
    { name: "Python", score: 95, required: 90 },
    { name: "Django/FastAPI", score: 88, required: 80 },
    { name: "PostgreSQL", score: 82, required: 75 },
    { name: "Docker/K8s", score: 78, required: 70 },
    { name: "REST API", score: 92, required: 85 },
  ];

  const softSkills = [
    { name: "Коммуникация", score: 85 },
    { name: "Командная работа", score: 90 },
    { name: "Решение проблем", score: 88 },
  ];

  const resumeHighlights = [
    { icon: "🎓", text: "МГТУ им. Баумана, Информатика" },
    { icon: "💼", text: "7 лет коммерческого опыта" },
    { icon: "🏢", text: "Яндекс, Сбер, Тинькофф" },
    { icon: "📍", text: "Москва, готов к гибриду" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
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
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}>
            🤖
          </div>
          <h1
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "white",
              margin: 0,
            }}
          >
          AI-анализ резюме
          </h1>
        </div>
        <p
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.6)",
            margin: "12px 0 0 0",
          }}
        >
          Алексей Смирнов • Senior Python Developer • Анализ за 2.3 сек
        </p>
      </div>

      {/* Основной контент - две колонки */}
      <div style={{
        position: "absolute",
        top: 180,
        left: 60,
        right: 60,
        display: "flex",
        gap: 30,
      }}>
        {/* Левая колонка - Технические навыки */}
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            padding: 30,
            opacity: interpolate(frame, [20, 40], [0, 1]),
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, color: "white", marginBottom: 24 }}>
            Технические навыки
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {technicalSkills.map((skill, i) => {
              const delay = 40 + i * 15;
              const progress = interpolate(frame, [delay, delay + 25], [0, skill.score], { extrapolateRight: "clamp" });
              const requiredProgress = interpolate(frame, [delay, delay + 25], [0, skill.required], { extrapolateRight: "clamp" });

              return (
                <div key={i}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 600, color: "white" }}>
                      {skill.name}
                    </span>
                    <span style={{ 
                      fontSize: 16, 
                      fontWeight: 700, 
                      color: skill.score >= skill.required ? "#10b981" : "#f59e0b" 
                    }}>
                      {Math.round(progress)}%
                      <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400, marginLeft: 8 }}>
                        / {skill.required}% треб.
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: 5,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* Линия требований */}
                    <div
                      style={{
                        position: "absolute",
                        left: `${requiredProgress}%`,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        background: "rgba(255,255,255,0.4)",
                      }}
                    />
                    {/* Прогресс */}
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: skill.score >= skill.required 
                          ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                          : "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
                        borderRadius: 5,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Soft skills */}
          <div style={{ marginTop: 30 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
              Личные качества (по резюме)
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {softSkills.map((skill, i) => {
                const opacity = interpolate(frame, [140 + i * 10, 155 + i * 10], [0, 1]);
                return (
                  <div
                    key={i}
                    style={{
                      padding: "10px 16px",
                      background: "rgba(139, 92, 246, 0.2)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: 10,
                      opacity,
                    }}
                  >
                    <div style={{ fontSize: 14, color: "white", fontWeight: 500 }}>{skill.name}</div>
                    <div style={{ fontSize: 18, color: "#8b5cf6", fontWeight: 700 }}>{skill.score}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Правая колонка - Резюме и итог */}
        <div style={{ width: 420, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Ключевые факты */}
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: 24,
              opacity: interpolate(frame, [60, 80], [0, 1]),
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 16 }}>
              Ключевые факты
            </div>
            {resumeHighlights.map((item, i) => {
              const opacity = interpolate(frame, [80 + i * 12, 95 + i * 12], [0, 1]);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: i < resumeHighlights.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none",
                    opacity,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontSize: 15, color: "rgba(255,255,255,0.8)" }}>{item.text}</span>
                </div>
              );
            })}
          </div>

          {/* Итоговая оценка */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 20,
              padding: 24,
              opacity: interpolate(frame, [180, 210], [0, 1]),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                }}
              >
                ✓
              </div>
              <div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Общая оценка</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#10b981" }}>94%</div>
              </div>
            </div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
              Кандидат соответствует требованиям вакансии. Рекомендуется пригласить на техническое собеседование.
            </div>
            <div style={{ 
              marginTop: 16, 
              padding: "12px 20px", 
              background: "#10b981", 
              borderRadius: 10,
              textAlign: "center",
              fontSize: 15,
              fontWeight: 600,
              color: "white",
            }}>
              Пригласить на собеседование →
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
