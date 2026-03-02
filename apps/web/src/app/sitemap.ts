import { MetadataRoute } from "next"
import { SITE_CONFIG } from "@/lib/seo-constants"

const baseUrl = SITE_CONFIG.url
const now = new Date()

// Статические страницы
const staticPages: MetadataRoute.Sitemap = [
  { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
  { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  { url: `${baseUrl}/features`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  { url: `${baseUrl}/products`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  { url: `${baseUrl}/products/integrations`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  { url: `${baseUrl}/products/task-management`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/products/ai-job-creation`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/products/ai-recruiter`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/products/ai-analyst`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/products/analytics`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/products/whitelabel`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/industries`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/industries/hr-agencies`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/industries/pharma`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  { url: `${baseUrl}/industries/manufacturing`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  { url: `${baseUrl}/industries/fintech`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  { url: `${baseUrl}/industries/retail`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  { url: `${baseUrl}/audiences`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/audiences/recruitment-agencies`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/audiences/hr-managers`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/audiences/company-leaders`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/audiences/startups`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
  { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
]

// Слаги постов блога (должны совпадать с blog/page.tsx и blog/[slug]/page.tsx)
const blogSlugs = [
  "ai-screening-launch",
  "telegram-integration",
  "hiring-guide-2026",
  "case-study-techcorp",
  "voice-interviews",
  "api-v2-release",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...blogPages]
}
