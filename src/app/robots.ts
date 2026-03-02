import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/project/', '/api/', '/auth/'],
    },
    sitemap: 'https://researchroomai.com/sitemap.xml',
  };
}