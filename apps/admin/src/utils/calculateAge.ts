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

/**
 * 截取字符串
 * @param text 字符串
 * @param maxLength 最大长度
 */
export function truncateText(
  text: string | undefined,
  maxLength: number = 10,
): string {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
