import { Injectable } from '@nestjs/common';
import { prisma } from '@campus-connect/database';

/**
 * Global grouped search across users, study groups, materials, products, posts.
 * Each entity is searched in parallel and capped at `take` results so the
 * response stays bounded even on broad queries.
 */
@Injectable()
export class SearchService {
  async searchAll(query: string, take = 5) {
    const keyword = query.trim();
    if (keyword.length < 2) {
      return { users: [], groups: [], materials: [], products: [], posts: [] };
    }
    
    // Enable pg_trgm if not already enabled (in a real app this should be in a migration)
    try {
      await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    } catch (e) {
      // Ignore extension creation errors if lack of permission
    }

    const contains = { contains: keyword, mode: 'insensitive' as const };

    const [users, groups, materials, products, posts] = await Promise.all([
      // Use pg_trgm similarity for Users
      prisma.$queryRaw`
        SELECT id, "fullName", "avatarUrl", major, cohort
        FROM users
        WHERE "isSuspended" = false 
          AND ("fullName" ILIKE ${'%' + keyword + '%'} OR "email" ILIKE ${'%' + keyword + '%'})
        ORDER BY GREATEST(SIMILARITY("fullName", ${keyword}), SIMILARITY("email", ${keyword})) DESC
        LIMIT ${take};
      `.catch(() => prisma.user.findMany({
        where: { isSuspended: false, OR: [{ fullName: contains }, { email: contains }, { studentId: contains }, { major: contains }, { department: contains }] },
        take,
        select: { id: true, fullName: true, avatarUrl: true, major: true, cohort: true },
      })),
      
      prisma.studyGroup.findMany({
        where: { OR: [{ title: contains }, { subject: contains }, { description: contains }] },
        take,
        select: { id: true, title: true, subject: true, memberCount: true, maxMembers: true },
      }),
      
      // Use pg_trgm similarity for Materials
      prisma.$queryRaw`
        SELECT id, title, subject, "fileType", "downloadCount"
        FROM materials
        WHERE title ILIKE ${'%' + keyword + '%'} OR subject ILIKE ${'%' + keyword + '%'}
        ORDER BY GREATEST(SIMILARITY(title, ${keyword}), SIMILARITY(subject, ${keyword})) DESC
        LIMIT ${take};
      `.catch(() => prisma.material.findMany({
        where: { OR: [{ title: contains }, { subject: contains }, { description: contains }] },
        take,
        select: { id: true, title: true, subject: true, fileType: true, downloadCount: true },
      })),
      
      prisma.product.findMany({
        where: { OR: [{ title: contains }, { description: contains }, { category: contains }] },
        take,
        select: { id: true, title: true, price: true, category: true, status: true, images: true },
      }),
      
      prisma.post.findMany({
        where: { content: contains, type: { not: 'STORY' } },
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
    ]);

    return { users, groups, materials, products, posts };
  }
}
