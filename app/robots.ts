import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://www.ogkaal.com"
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/kaal-admin-console", "/dashboard/"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
