"use client";

import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DashboardScene } from "../scenes/DashboardScene";
import { CandidatesScene } from "../scenes/CandidatesScene";
import { AIScreeningScene } from "../scenes/AIScreeningScene";
import { InterviewScene } from "../scenes/InterviewScene";
import { AnalyticsScene } from "../scenes/AnalyticsScene";

export const PlatformOverview: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Тайминги для каждой сцены (в секундах)
  const scenes = [
    { start: 0, duration: 9, component: DashboardScene }, // 0-9s
    { start: 9, duration: 9, component: CandidatesScene }, // 9-18s
    { start: 18, duration: 9, component: AIScreeningScene }, // 18-27s
    { start: 27, duration: 9, component: InterviewScene }, // 27-36s
    { start: 36, duration: 9, component: AnalyticsScene }, // 36-45s
  ];

  const currentTime = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {scenes.map((scene, index) => {
        const sceneStart = scene.start * fps;
        const sceneEnd = (scene.start + scene.duration) * fps;
        const Scene = scene.component;

        if (frame < sceneStart || frame >= sceneEnd) return null;

        const sceneFrame = frame - sceneStart;
        const sceneDuration = scene.duration * fps;

        // Fade in/out эффекты
        const fadeInDuration = fps * 0.5; // 0.5 секунды
        const fadeOutDuration = fps * 0.5;

        const opacity = interpolate(
          sceneFrame,
          [0, fadeInDuration, sceneDuration - fadeOutDuration, sceneDuration],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <AbsoluteFill key={index} style={{ opacity }}>
            <Scene frame={sceneFrame} />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
