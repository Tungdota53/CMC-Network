/**
 * Shared student identity utilities for CMC University.
 *
 * Extracts studentId, cohort, and major from student emails
 * (e.g. BIT250108@st.cmc.edu.vn → studentId: BIT250108, cohort: K4, major: Công nghệ Thông tin).
 */

/** CMC University major code mapping. */
export const MAJOR_MAP: Record<string, string> = {
  AI: 'Trí tuệ Nhân tạo',
  BA: 'Quản trị Kinh doanh',
  CB: 'Tiếng Trung Thương mại',
  CL: 'Ngôn ngữ Trung Quốc',
  CS: 'Khoa học Máy tính',
  DA: 'Thiết kế Mỹ thuật số',
  EC: 'Công nghệ Kỹ thuật Điện tử - Viễn thông',
  EM: 'Thương mại Điện tử',
  GA: 'Đồ họa Game',
  GD: 'Thiết kế Đồ họa',
  IB: 'Kinh doanh Quốc tế',
  IT: 'Công nghệ Thông tin',
  KL: 'Ngôn ngữ Hàn Quốc',
  LS: 'Logistics và Quản lý chuỗi cung ứng',
  MC: 'Truyền thông Đa phương tiện',
  NS: 'An ninh Mạng',
  PR: 'Quan hệ Công chúng',
  SE: 'Kỹ thuật Phần mềm',
};

/** Email domains recognised as CMC student emails. */
export const CMC_STUDENT_DOMAINS = ['@st.cmc.edu.vn', '@st.cmcu.edu.vn'];

export interface StudentInfo {
  studentId: string | null;
  cohort: string | null;
  major: string | null;
}

/** Parse student metadata from an email address or a raw student-ID string. */
export function parseStudentInfo(identifier: string): StudentInfo {
  const result: StudentInfo = { studentId: null, cohort: null, major: null };

  let rawId = '';
  if (identifier.includes('@')) {
    const email = identifier.toLowerCase();
    if (CMC_STUDENT_DOMAINS.some((d) => email.endsWith(d))) {
      rawId = email.split('@')[0].toUpperCase();
    }
  } else {
    rawId = identifier.toUpperCase();
  }

  if (!rawId) return result;
  result.studentId = rawId;

  const match = rawId.match(/^([A-Za-z]+)(\d{2})\d+$/);
  if (!match) return result;

  const letters = match[1].toUpperCase();
  const yearPrefix = parseInt(match[2], 10);

  // Khoá 1 started in 2022 (prefix 22) → cohortNum = yearPrefix - 21.
  const cohortNum = yearPrefix - 21;
  if (cohortNum > 0) {
    result.cohort = `K${cohortNum}`;
  }

  const majorCode = letters.length >= 2 ? letters.slice(-2) : letters;
  if (MAJOR_MAP[majorCode]) {
    result.major = MAJOR_MAP[majorCode];
  }

  return result;
}

/** Check if an email belongs to a CMC student domain. */
export function isCmcStudentEmail(email: string): boolean {
  return CMC_STUDENT_DOMAINS.some((d) => email.toLowerCase().endsWith(d));
}
