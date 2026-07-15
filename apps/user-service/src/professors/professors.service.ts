import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@campus-connect/database';

type ListQuery = { search?: string; faculty?: string; sort?: string };

@Injectable()
export class ProfessorsService {
  async list(query: ListQuery) {
    const where: Prisma.ProfessorWhereInput = {};
    if (query.faculty && query.faculty !== 'Tất cả')
      where.faculty = query.faculty;
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { faculty: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }
    const orderBy: Prisma.ProfessorOrderByWithRelationInput[] =
      query.sort === 'name_asc'
        ? [{ name: 'asc' }]
        : query.sort === 'reviews_desc'
          ? [{ reviewCount: 'desc' }, { rating: 'desc' }]
          : [{ rating: 'desc' }, { reviewCount: 'desc' }];

    return prisma.professor.findMany({ where, orderBy, take: 100 });
  }

  async create(data: Record<string, unknown>) {
    return prisma.professor.create({
      data: {
        name: this.required(data.name, 'Tên giảng viên'),
        faculty: this.optional(data.faculty),
        department: this.optional(data.department),
        avatarUrl: this.optional(data.avatarUrl),
        bio: this.optional(data.bio),
      },
    });
  }

  async detail(id: string) {
    const professor = await prisma.professor.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                major: true,
              },
            },
          },
        },
      },
    });
    if (!professor) throw new NotFoundException('Không tìm thấy giảng viên');
    const difficulty = professor.reviews.length
      ? professor.reviews.reduce((sum, review) => sum + review.difficulty, 0) /
        professor.reviews.length
      : 0;
    return { ...professor, difficulty: Math.round(difficulty * 10) / 10 };
  }

  async reviews(professorId: string) {
    await this.ensureProfessor(professorId);
    return prisma.professorReview.findMany({
      where: { professorId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true, major: true },
        },
      },
    });
  }

  async upsertReview(
    professorId: string,
    userId: string,
    data: Record<string, unknown>,
  ) {
    await this.ensureProfessor(professorId);
    const rating = Number(data.rating);
    const difficulty =
      data.difficulty === undefined ? 3 : Number(data.difficulty);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      throw new BadRequestException('Rating phải từ 1 đến 5');
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5)
      throw new BadRequestException('Độ khó phải từ 1 đến 5');

    const review = await prisma.professorReview.upsert({
      where: { professorId_userId: { professorId, userId } },
      create: {
        professorId,
        userId,
        rating,
        difficulty,
        subject: this.optional(data.subject),
        content: this.optional(data.content),
      },
      update: {
        rating,
        difficulty,
        subject: this.optional(data.subject),
        content: this.optional(data.content),
      },
    });
    await this.refreshAggregate(professorId);
    return review;
  }

  async deleteMyReview(professorId: string, userId: string) {
    const review = await prisma.professorReview.findUnique({
      where: { professorId_userId: { professorId, userId } },
    });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
    await prisma.professorReview.delete({ where: { id: review.id } });
    await this.refreshAggregate(professorId);
    return { success: true };
  }

  private async ensureProfessor(id: string) {
    const professor = await prisma.professor.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!professor) throw new NotFoundException('Không tìm thấy giảng viên');
  }

  private async refreshAggregate(professorId: string) {
    const aggregate = await prisma.professorReview.aggregate({
      where: { professorId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.professor.update({
      where: { id: professorId },
      data: {
        rating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
        reviewCount: aggregate._count,
      },
    });
  }

  private required(value: unknown, label: string) {
    const text = (
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : ''
    ).trim();
    if (!text) throw new BadRequestException(`${label} không được để trống`);
    return text.slice(0, 255);
  }

  private optional(value: unknown) {
    const text = (
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : ''
    ).trim();
    return text ? text.slice(0, 1000) : null;
  }
}
