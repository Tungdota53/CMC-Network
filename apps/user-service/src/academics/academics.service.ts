import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@campus-connect/database';

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

@Injectable()
export class AcademicsService {
  async getGrades(userId: string) {
    return prisma.gradeRecord.findMany({
      where: { userId },
      orderBy: [{ semester: 'asc' }, { subject: 'asc' }],
    });
  }

  async getGradeSummary(userId: string) {
    const grades = await this.getGrades(userId);
    const credits = grades.reduce((sum, grade) => sum + grade.credits, 0);
    const weighted10 = grades.reduce(
      (sum, grade) => sum + grade.grade10 * grade.credits,
      0,
    );
    const gpa10 = credits ? weighted10 / credits : 0;
    const gpa4 = this.toGpa4(gpa10);
    const trend = Object.values(
      grades.reduce<
        Record<string, { sem: string; credits: number; weighted10: number }>
      >((acc, grade) => {
        acc[grade.semester] ??= {
          sem: grade.semester,
          credits: 0,
          weighted10: 0,
        };
        acc[grade.semester].credits += grade.credits;
        acc[grade.semester].weighted10 += grade.grade10 * grade.credits;
        return acc;
      }, {}),
    ).map((item) => ({
      sem: item.sem,
      gpa10: item.credits ? item.weighted10 / item.credits : 0,
      gpa4: this.toGpa4(item.credits ? item.weighted10 / item.credits : 0),
    }));

    return {
      gpa4,
      gpa10,
      totalCredits: credits,
      totalSubjects: grades.length,
      trend,
    };
  }

  async getFacultyComparison(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true, major: true },
    });
    if (!user) return [];

    const peers = await prisma.user.findMany({
      where: {
        ...(user.department ? { department: user.department } : {}),
        ...(user.major ? { major: user.major } : {}),
      },
      select: {
        id: true,
        fullName: true,
        gradeRecords: { select: { grade10: true, credits: true } },
      },
      take: 200,
    });

    const gpas = peers
      .map((peer) => ({
        label: peer.id === userId ? 'Bạn' : peer.fullName,
        gpa: this.peerGpa4(peer.gradeRecords),
      }))
      .filter((item) => item.gpa > 0);

    if (gpas.length === 0) return [];

    const average = gpas.reduce((sum, item) => sum + item.gpa, 0) / gpas.length;
    const mine = gpas.find((item) => item.label === 'Bạn')?.gpa ?? 0;
    const top = Math.max(...gpas.map((item) => item.gpa));

    return [
      { label: 'Bạn', gpa: mine, color: 'bg-primary' },
      { label: 'Trung bình khoa', gpa: average, color: 'bg-blue-500' },
      { label: 'Top khoa', gpa: top, color: 'bg-emerald-500' },
    ];
  }

  async createGrade(userId: string, data: Record<string, unknown>) {
    return prisma.gradeRecord.create({
      data: this.gradeCreatePayload(userId, data),
    });
  }

  private peerGpa4(records: { grade10: number; credits: number }[]) {
    const credits = records.reduce((sum, grade) => sum + grade.credits, 0);
    if (!credits) return 0;
    const gpa10 =
      records.reduce((sum, grade) => sum + grade.grade10 * grade.credits, 0) /
      credits;
    return this.toGpa4(gpa10);
  }

  async importGrades(userId: string, items: Record<string, unknown>[]) {
    if (!Array.isArray(items) || items.length === 0)
      throw new BadRequestException('Danh sách điểm trống');
    if (items.length > 100)
      throw new BadRequestException('Tối đa 100 môn mỗi lần import');
    const created = await prisma.$transaction(
      items.map((item) =>
        prisma.gradeRecord.create({
          data: this.gradeCreatePayload(userId, item),
        }),
      ),
    );
    return { items: created, total: created.length };
  }

  async updateGrade(id: string, userId: string, data: Record<string, unknown>) {
    await this.ensureGradeOwner(id, userId);
    return prisma.gradeRecord.update({
      where: { id },
      data: this.gradePayload(userId, data, true),
    });
  }

  async deleteGrade(id: string, userId: string) {
    await this.ensureGradeOwner(id, userId);
    await prisma.gradeRecord.delete({ where: { id } });
    return { success: true };
  }

  async getTimetableEvents(userId: string) {
    const entries = await prisma.timetableEntry.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return entries.map((entry) => this.toCalendarEvent(entry));
  }

  async getClassmates(userId: string, classCode: string) {
    if (!classCode.trim()) return [];
    return prisma.user.findMany({
      where: { id: { not: userId }, timetableEntries: { some: { classCode } } },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        major: true,
        cohort: true,
      },
      take: 30,
    });
  }

  async createTimetableEvent(userId: string, data: Record<string, unknown>) {
    const payload = this.timetableCreatePayload(userId, data);
    await this.ensureNoTimetableConflict(
      userId,
      payload.dayOfWeek,
      payload.startTime,
      payload.endTime,
    );
    return this.toCalendarEvent(
      await prisma.timetableEntry.create({ data: payload }),
    );
  }

  async importTimetableEvents(
    userId: string,
    items: Record<string, unknown>[],
  ) {
    if (!Array.isArray(items) || items.length === 0)
      throw new BadRequestException('Danh sách lịch học trống');
    if (items.length > 100)
      throw new BadRequestException('Tối đa 100 lịch học mỗi lần import');
    const payloads = items.map((item) =>
      this.timetableCreatePayload(userId, item),
    );
    for (let index = 0; index < payloads.length; index += 1) {
      const item = payloads[index];
      await this.ensureNoTimetableConflict(
        userId,
        item.dayOfWeek,
        item.startTime,
        item.endTime,
      );
      const duplicateIndex = payloads.findIndex(
        (other, otherIndex) =>
          otherIndex !== index &&
          other.dayOfWeek === item.dayOfWeek &&
          this.isOverlap(
            item.startTime,
            item.endTime,
            other.startTime,
            other.endTime,
          ),
      );
      if (duplicateIndex >= 0)
        throw new ConflictException(
          `Dòng ${index + 1} trùng giờ với dòng ${duplicateIndex + 1}`,
        );
    }
    const created = await prisma.$transaction(
      payloads.map((payload) =>
        prisma.timetableEntry.create({ data: payload }),
      ),
    );
    return {
      items: created.map((entry) => this.toCalendarEvent(entry)),
      total: created.length,
    };
  }

  async updateTimetableEvent(
    id: string,
    userId: string,
    data: Record<string, unknown>,
  ) {
    await this.ensureTimetableOwner(id, userId);
    const existing = await prisma.timetableEntry.findUniqueOrThrow({
      where: { id },
    });
    const patch = this.timetablePayload(userId, data, true);
    const next = { ...existing, ...patch };
    await this.ensureNoTimetableConflict(
      userId,
      next.dayOfWeek,
      next.startTime,
      next.endTime,
      id,
    );
    return this.toCalendarEvent(
      await prisma.timetableEntry.update({ where: { id }, data: patch }),
    );
  }

  async deleteTimetableEvent(id: string, userId: string) {
    await this.ensureTimetableOwner(id, userId);
    await prisma.timetableEntry.delete({ where: { id } });
    return { success: true };
  }

  private gradePayload(
    userId: string,
    data: Record<string, unknown>,
    partial = false,
  ) {
    const payload: {
      userId: string;
      subject?: string;
      subjectCode?: string | null;
      semester?: string;
      credits?: number;
      grade10?: number;
      letter?: string;
    } = { userId };
    if (data.subject !== undefined || data.subjectName !== undefined)
      payload.subject = this.cleanString(
        data.subject ?? data.subjectName,
        'Tên môn học',
      );
    if (data.subjectCode !== undefined)
      payload.subjectCode = this.cleanOptionalString(data.subjectCode);
    if (data.semester !== undefined)
      payload.semester = this.cleanString(data.semester, 'Học kỳ');
    if (data.credits !== undefined) payload.credits = Number(data.credits);
    if (data.grade10 !== undefined || data.grade !== undefined)
      payload.grade10 = Number(data.grade10 ?? data.grade);
    if (data.letter !== undefined)
      payload.letter = this.cleanString(data.letter, 'Điểm chữ').toUpperCase();
    if (
      !partial &&
      (!payload.subject ||
        !payload.semester ||
        payload.credits === undefined ||
        payload.grade10 === undefined)
    )
      throw new BadRequestException('Thiếu dữ liệu điểm');
    if (
      payload.credits !== undefined &&
      (!Number.isInteger(payload.credits) ||
        payload.credits < 1 ||
        payload.credits > 10)
    )
      throw new BadRequestException('Tín chỉ phải từ 1 đến 10');
    if (
      payload.grade10 !== undefined &&
      (!Number.isFinite(payload.grade10) ||
        payload.grade10 < 0 ||
        payload.grade10 > 10)
    )
      throw new BadRequestException('Điểm hệ 10 phải từ 0 đến 10');
    payload.letter ??= this.toLetter(payload.grade10 ?? 0);
    return payload;
  }

  private gradeCreatePayload(
    userId: string,
    data: Record<string, unknown>,
  ): Prisma.GradeRecordUncheckedCreateInput {
    const payload = this.gradePayload(userId, data);
    if (
      !payload.subject ||
      !payload.semester ||
      payload.credits === undefined ||
      payload.grade10 === undefined ||
      !payload.letter
    )
      throw new BadRequestException('Thiếu dữ liệu điểm');
    return {
      userId,
      subject: payload.subject,
      subjectCode: payload.subjectCode,
      semester: payload.semester,
      credits: payload.credits,
      grade10: payload.grade10,
      letter: payload.letter,
    };
  }

  private timetablePayload(
    userId: string,
    data: Record<string, unknown>,
    partial = false,
  ) {
    const payload: {
      userId: string;
      title?: string;
      classCode?: string | null;
      room?: string | null;
      lecturer?: string | null;
      startTime?: string;
      endTime?: string;
      color?: string | null;
      dayOfWeek?: number;
    } = { userId };
    if (data.title !== undefined)
      payload.title = this.cleanString(data.title, 'Tên môn học');
    for (const key of ['classCode', 'room', 'lecturer', 'color'] as const)
      if (data[key] !== undefined)
        payload[key] = this.cleanOptionalString(data[key]);
    if (data.startTime !== undefined)
      payload.startTime = this.cleanTime(data.startTime, 'Giờ bắt đầu');
    if (data.endTime !== undefined)
      payload.endTime = this.cleanTime(data.endTime, 'Giờ kết thúc');
    if (data.dayOfWeek !== undefined)
      payload.dayOfWeek = Number(data.dayOfWeek);
    if (typeof data.day === 'string')
      payload.dayOfWeek = DAY_LABELS.indexOf(data.day);
    if (
      !partial &&
      (!payload.title ||
        payload.dayOfWeek === undefined ||
        !payload.startTime ||
        !payload.endTime)
    )
      throw new BadRequestException('Thiếu dữ liệu lịch học');
    if (
      payload.dayOfWeek !== undefined &&
      (!Number.isInteger(payload.dayOfWeek) ||
        payload.dayOfWeek < 0 ||
        payload.dayOfWeek > 6)
    )
      throw new BadRequestException('Thứ học không hợp lệ');
    if (
      payload.startTime &&
      payload.endTime &&
      this.timeToMinutes(payload.startTime) >=
        this.timeToMinutes(payload.endTime)
    )
      throw new BadRequestException('Giờ kết thúc phải sau giờ bắt đầu');
    return payload;
  }

  private timetableCreatePayload(
    userId: string,
    data: Record<string, unknown>,
  ): Prisma.TimetableEntryUncheckedCreateInput {
    const payload = this.timetablePayload(userId, data);
    if (
      !payload.title ||
      payload.dayOfWeek === undefined ||
      !payload.startTime ||
      !payload.endTime
    )
      throw new BadRequestException('Thiếu dữ liệu lịch học');
    return {
      userId,
      title: payload.title,
      classCode: payload.classCode,
      room: payload.room,
      lecturer: payload.lecturer,
      dayOfWeek: payload.dayOfWeek,
      startTime: payload.startTime,
      endTime: payload.endTime,
      color: payload.color,
    };
  }

  private async ensureNoTimetableConflict(
    userId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ) {
    const entries = await prisma.timetableEntry.findMany({
      where: {
        userId,
        dayOfWeek,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    const conflict = entries.find((entry) =>
      this.isOverlap(startTime, endTime, entry.startTime, entry.endTime),
    );
    if (conflict)
      throw new ConflictException(
        `Trùng lịch với ${conflict.title} (${conflict.startTime} - ${conflict.endTime})`,
      );
  }

  private isOverlap(
    startA: string,
    endA: string,
    startB: string,
    endB: string,
  ) {
    return (
      this.timeToMinutes(startA) < this.timeToMinutes(endB) &&
      this.timeToMinutes(startB) < this.timeToMinutes(endA)
    );
  }

  private cleanString(value: unknown, label: string) {
    const text = (
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : ''
    ).trim();
    if (!text) throw new BadRequestException(`${label} không được để trống`);
    if (text.length > 255) throw new BadRequestException(`${label} quá dài`);
    return text;
  }

  private cleanOptionalString(value: unknown) {
    const text = (
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : ''
    ).trim();
    return text ? text.slice(0, 255) : null;
  }

  private cleanTime(value: unknown, label: string) {
    const text = this.cleanString(value, label);
    if (!TIME_RE.test(text))
      throw new BadRequestException(`${label} phải có định dạng HH:mm`);
    return text;
  }

  private async ensureGradeOwner(id: string, userId: string) {
    const grade = await prisma.gradeRecord.findFirst({ where: { id, userId } });
    if (!grade) throw new NotFoundException('Không tìm thấy điểm');
  }

  private async ensureTimetableOwner(id: string, userId: string) {
    const event = await prisma.timetableEntry.findFirst({
      where: { id, userId },
    });
    if (!event) throw new NotFoundException('Không tìm thấy lịch học');
  }

  private toCalendarEvent(entry: {
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    room?: string | null;
    [key: string]: unknown;
  }) {
    const start = this.timeToMinutes(entry.startTime);
    const end = this.timeToMinutes(entry.endTime);
    return {
      ...entry,
      day: DAY_LABELS[entry.dayOfWeek] ?? 'Thứ 2',
      location: entry.room,
      time: `${entry.startTime} - ${entry.endTime}`,
      topPx: Math.max(0, ((start - 420) / 60) * 80),
      heightPx: Math.max(48, ((end - start) / 60) * 80),
    };
  }

  private timeToMinutes(time: string) {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + (minute || 0);
  }

  private toGpa4(gpa10: number) {
    return Math.round(Math.min(4, Math.max(0, (gpa10 / 10) * 4)) * 100) / 100;
  }

  private toLetter(grade10: number) {
    if (grade10 >= 8.5) return 'A';
    if (grade10 >= 7) return 'B';
    if (grade10 >= 5.5) return 'C';
    if (grade10 >= 4) return 'D';
    return 'F';
  }
}
