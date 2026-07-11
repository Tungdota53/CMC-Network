import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { prisma, ConversationType } from '@campus-connect/database';

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
        creator: { connect: { id: data.creatorId } },
        title: data.title,
        subject: data.subject,
        description: data.description,
        location: data.location,
        maxMembers: data.maxMembers,
        scheduledTime: new Date(data.scheduledTime),
        schedule: data.schedule,
        type: data.type || 'STUDY',
        memberCount: 1,
        conversation: {
          create: {
            type: ConversationType.GROUP,
            name: data.title,
            members: {
              create: {
                userId: data.creatorId,
                role: 'admin',
              },
            },
          },
        },
      },
      include: { conversation: true },
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

  /** Update a study group. Only the creator may edit. */
  async updateStudyGroup(groupId: string, userId: string, data: any) {
    const group = await this.assertCreator(groupId, userId);

    return prisma.studyGroup.update({
      where: { id: group.id },
      data: {
        title: data.title ?? group.title,
        subject: data.subject ?? group.subject,
        description: data.description ?? group.description,
        location: data.location ?? group.location,
        maxMembers: data.maxMembers ?? group.maxMembers,
        scheduledTime: data.scheduledTime
          ? new Date(data.scheduledTime)
          : group.scheduledTime,
        schedule: data.schedule ?? group.schedule,
        status: data.status ?? group.status,
        type: data.type ?? group.type,
      },
    });
  }

  /** Delete a study group. Only the creator may delete. */
  async deleteStudyGroup(groupId: string, userId: string) {
    await this.assertCreator(groupId, userId);
    await prisma.studyGroup.delete({ where: { id: groupId } });
    return { deleted: true, id: groupId };
  }

  /** A user requests to join a group. Idempotent; blocks if already a member or full. */
  async requestToJoin(groupId: string, userId: string) {
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm học');

    const existingMember = await prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existingMember)
      throw new BadRequestException('Bạn đã là thành viên của nhóm');

    if (group.memberCount >= group.maxMembers) {
      throw new BadRequestException('Nhóm đã đủ thành viên');
    }

    return prisma.joinRequest.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId, status: 'PENDING' },
      update: { status: 'PENDING' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  /** List pending join requests for a group (creator only). */
  async listJoinRequests(groupId: string, userId: string) {
    await this.assertCreator(groupId, userId);
    return prisma.joinRequest.findMany({
      where: { groupId, status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            major: true,
            cohort: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Accept or reject a join request (creator only). Accepting adds a member. */
  async respondJoinRequest(
    groupId: string,
    creatorId: string,
    requestId: string,
    action: 'accept' | 'reject',
  ) {
    await this.assertCreator(groupId, creatorId);

    const request = await prisma.joinRequest.findFirst({
      where: { id: requestId, groupId, status: 'PENDING' },
    });
    if (!request)
      throw new NotFoundException('Không tìm thấy yêu cầu tham gia');

    if (action === 'accept') {
      const group = await prisma.studyGroup.findUnique({
        where: { id: groupId },
      });
      if (group && group.memberCount >= group.maxMembers) {
        throw new BadRequestException('Nhóm đã đủ thành viên');
      }

      // If the user is somehow already a member, just approve the request —
      // creating the member row again would hit the unique constraint and
      // roll back the whole transaction.
      const alreadyMember = await prisma.studyGroupMember.findUnique({
        where: { groupId_userId: { groupId, userId: request.userId } },
      });
      if (alreadyMember) {
        await prisma.joinRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
        });
        return { status: 'APPROVED', requestId };
      }

      await prisma.$transaction([
        prisma.studyGroupMember.create({
          data: { groupId, userId: request.userId, role: 'member' },
        }),
        prisma.studyGroup.update({
          where: { id: groupId },
          data: { memberCount: { increment: 1 } },
        }),
        prisma.joinRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
        }),
      ]);

      // Thêm member vào group chat
      if (group?.conversationId) {
        await prisma.conversationMember
          .create({
            data: {
              conversationId: group.conversationId,
              userId: request.userId,
              role: 'member',
            },
          })
          .catch(() => null); // Bỏ qua nếu đã có
      }

      return { status: 'APPROVED', requestId };
    }

    await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });
    return { status: 'REJECTED', requestId };
  }

  private async assertCreator(groupId: string, userId: string) {
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm học');
    if (group.creatorId !== userId) {
      throw new ForbiddenException('Chỉ người tạo nhóm mới có quyền này');
    }
    return group;
  }

  /** Update whiteboard data for a study group. Any member can update. */
  async updateWhiteboard(groupId: string, userId: string, data: any) {
    await this.assertMember(groupId, userId);
    return prisma.studyGroup.update({
      where: { id: groupId },
      data: { whiteboardData: data },
    });
  }

  /** Update todo list for a study group. Any member can update. */
  async updateTodoList(groupId: string, userId: string, data: any) {
    await this.assertMember(groupId, userId);
    return prisma.studyGroup.update({
      where: { id: groupId },
      data: { todoList: data },
    });
  }

  private async assertMember(groupId: string, userId: string) {
    const member = await prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) {
      throw new ForbiddenException('Chỉ thành viên mới có quyền này');
    }
    return member;
  }

  // --- STUDY REQUESTS ---

  async getStudyRequests() {
    return prisma.studyRequest.findMany({
      include: {
        user: { select: { fullName: true, avatarUrl: true, major: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStudyRequest(userId: string, data: any) {
    return prisma.studyRequest.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        subject: data.subject,
        type: data.type || 'FIND_PARTNER',
        preferredTime: data.preferredTime,
        preferredLocation: data.preferredLocation,
      },
    });
  }

  async updateStudyRequest(id: string, userId: string, data: any) {
    const req = await prisma.studyRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Không tìm thấy yêu cầu');
    if (req.userId !== userId)
      throw new ForbiddenException('Chỉ người tạo mới có quyền sửa');

    const sanitized: Record<string, unknown> = {};
    for (const key of [
      'title',
      'subject',
      'description',
      'preferredTime',
      'preferredLocation',
      'status',
    ]) {
      if (data[key] !== undefined) {
        sanitized[key] = data[key];
      }
    }

    return prisma.studyRequest.update({
      where: { id },
      data: sanitized,
    });
  }

  async deleteStudyRequest(id: string, userId: string) {
    const req = await prisma.studyRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Không tìm thấy yêu cầu');
    if (req.userId !== userId)
      throw new ForbiddenException('Chỉ người tạo mới có quyền xóa');

    await prisma.studyRequest.delete({ where: { id } });
    return { deleted: true, id };
  }
}
