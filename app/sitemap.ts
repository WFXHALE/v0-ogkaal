import type { MetadataRoute } from "next"

const siteUrl = "https://www.ogkaal.com"
const publicRoutes = [
  "",
  "/about",
  "/mentorship",
  "/resources",
  "/prop-firms",
  "/intelligence",
  "/smc-guide",
  "/contact",
  "/terms",
  "/privacy",
  "/disclaimer",
]

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map(path => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }))
}
