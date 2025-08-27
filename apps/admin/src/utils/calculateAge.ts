import dayjs from 'dayjs';

/**
 * 计算年龄
 * @param timestamp 时间戳
 * @returns 年龄
 */
export function calculateAge(timestamp: Date | number | string): number {
  if (!timestamp) return 0;

  const birthDate = dayjs(timestamp);
  const today = dayjs();

  return today.diff(birthDate, 'year');
}
