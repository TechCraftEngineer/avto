"use client";

import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";

interface SceneProps {
  frame: number;
}

export const CandidatesScene: React.FC<SceneProps> = ({ frame }) => {
  const { fps } = useVideoConfig();

  // Реальные кандидаты с российскими именами и позициями
  const candidates = [
    { 
      name: "Алексей Смирнов", 
      role: "Senior Python Developer", 
      experience: "7 лет опыта",
      location: "Москва",
      salary: "380 000 ₽",
      match: 94, 
      status: "Новый",
      skills: ["Python", "Django", "PostgreSQL", "Docker"]
    },
    { 
      name: "Екатерина Волкова", 
      role: "Product Manager", 
      experience: "5 лет опыта",
      location: "Санкт-Петербург",
      salary: "270 000 ₽",
      match: 91, 
      status: "Отбор",
      skills: ["Agile", "Jira", "SQL", "Figma"]
    },
    { 
      name: "Дмитрий Козлов", 
      role: "DevOps Engineer", 
      experience: "4 года опыта",
      location: "Казань (удалённо)",
      salary: "300 000 ₽",
      match: 87, 
      status: "Интервью",
      skills: ["Kubernetes", "AWS", "Terraform", "CI/CD"]
    },
    { 
      name: "Мария Новикова", 
      role: "Frontend Developer", 
      experience: "3 года опыта",
      location: "Новосибирск (удалённо)",
      salary: "220 000 ₽",
      match: 85, 
      status: "Новый",
      skills: ["React", "TypeScript", "Next.js", "Tailwind"]
    },
  ];

  const titleOpacity = interpolate(frame, [0, 15], [0, 1]);

  const statusColors: Record<string, string> = {
    "Новый": "#10b981",
    "Отбор": "#f59e0b",
    "Интервью": "#3b82f6",
  };

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
              fontSize: 56,
              fontWeight: 800,
              color: "white",
              margin: 0,
            }}
          >
            База кандидатов
          </h1>
          <p
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.6)",
              margin: "8px 0 0 0",
            }}
          >
            Senior Python Developer • 89 откликов
          </p>
        </div>
        <div style={{ 
          display: "flex", 
          gap: 12,
          opacity: interpolate(frame, [20, 35], [0, 1]),
        }}>
          <div style={{
            padding: "10px 20px",
            background: "rgba(16, 185, 129, 0.2)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: 8,
            color: "#10b981",
            fontSize: 14,
            fontWeight: 600,
          }}>
            ИИ-сортировка ✓
          </div>
          <div style={{
            padding: "10px 20px",
            background: "rgba(59, 130, 246, 0.2)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: 8,
            color: "#3b82f6",
            fontSize: 14,
            fontWeight: 600,
          }}>
            Фильтры: Москва, от 300к
          </div>
        </div>
      </div>

      {/* Список кандидатов */}
      <div
        style={{
          position: "absolute",
          top: 180,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {candidates.map((candidate, i) => {
          const delay = i * 20;
          const cardOpacity = interpolate(frame, [delay + 30, delay + 50], [0, 1]);
          const cardX = interpolate(frame, [delay + 30, delay + 50], [-60, 0]);

          const scale = spring({
            frame: Math.max(0, frame - delay - 30),
            fps,
            config: { damping: 100, stiffness: 200 },
          });

          return (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                alignItems: "center",
                gap: 24,
                opacity: cardOpacity,
                transform: `translateX(${cardX}px) scale(${scale})`,
              }}
            >
              {/* Аватар */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${statusColors[candidate.status]}40 0%, ${statusColors[candidate.status]}20 100%)`,
                  border: `2px solid ${statusColors[candidate.status]}50`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 700,
                  color: statusColors[candidate.status],
                }}
              >
                {candidate.name.split(" ").map(n => n[0]).join("")}
              </div>

              {/* Информация */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "white" }}>
                    {candidate.name}
                  </div>
                  <div style={{
                    padding: "4px 10px",
                    background: `${statusColors[candidate.status]}20`,
                    borderRadius: 6,
                    color: statusColors[candidate.status],
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {candidate.status}
                  </div>
                </div>
                <div style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
                  {candidate.role} • {candidate.experience} • {candidate.location}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {candidate.skills.map((skill, j) => (
                    <div
                      key={j}
                      style={{
                        padding: "4px 10px",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        color: "rgba(255,255,255,0.8)",
                        fontSize: 12,
                      }}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>

              {/* Зарплата */}
              <div style={{ textAlign: "right", marginRight: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>
                  {candidate.salary}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                  ожидания
                </div>
              </div>

              {/* Match score */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  background: `conic-gradient(#10b981 ${candidate.match * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 8,
                    background: "#0f172a",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>
                    {candidate.match}%
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                    совпадение
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
