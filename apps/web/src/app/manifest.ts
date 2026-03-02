import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QBS Автонайм — AI-платформа автоматизации подбора персонала",
    short_name: "QBS Автонайм",
    description:
      "Автоматизируйте подбор персонала с помощью искусственного интеллекта. AI-скрининг резюме, интервью в веб-чате, интеграция с hh.ru.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6366f1",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    categories: ["business", "productivity"],
    lang: "ru",
    dir: "ltr",
  }
}
