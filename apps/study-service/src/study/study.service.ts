import { Injectable } from '@nestjs/common';
import { prisma } from '@campus-connect/database';

@Injectable()
export class StudyService {
  async getStudyGroups() {
    return prisma.studyGroup.findMany({
      include: { creator: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStudyGroup(data: any) {
    const group = await prisma.studyGroup.create({
      data: {
        creatorId: data.creatorId,
        title: data.title,
        subject: data.subject,
        description: data.description,
        location: data.location,
        maxMembers: data.maxMembers,
        scheduledTime: new Date(data.scheduledTime),
        schedule: data.schedule,
      },
    });

    await prisma.studyGroupMember.create({
      data: {
        groupId: group.id,
        userId: group.creatorId,
        role: 'owner',
      },
    });

    return group;
  }
}
