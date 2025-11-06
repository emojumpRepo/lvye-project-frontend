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
 * 根据身份证号码中获取出生日期和性别信息。
 * @param {string} idNumber 一个有效的15位或18位中国大陆居民身份证号码。
 * @returns {object|null} 包含 'birthDate' (YYYY-MM-DD) 和 'gender' ('男' 或 '女') 的对象。如果日期逻辑错误，则返回 null。
 */
export function getInfoFromIdCard(idNumber: string) {
  if (!idNumber) return null;

  let birthDateStr = '';
  let genderCode = '';

  // 1. 根据长度提取出生日期和性别码
  if (idNumber.length === 18) {
    birthDateStr = idNumber.slice(6, 14);
    genderCode = idNumber.charAt(16); // 第17位
  } else if (idNumber.length === 15) {
    birthDateStr = `19${idNumber.slice(6, 12)}`;
    genderCode = idNumber.charAt(14); // 第15位
  } else {
    console.error(`错误：接收到非预期的身份证长度 ${idNumber.length}。`);
    return null;
  }

  // 2. 严格校验日期的逻辑有效性
  const year = Number.parseInt(birthDateStr.slice(0, 4), 10);
  const month = Number.parseInt(birthDateStr.slice(4, 6), 10);
  const day = Number.parseInt(birthDateStr.slice(6, 8), 10);
  const date = new Date(year, month - 1, day); // month从0开始

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    console.error(`错误：身份证号码 '${idNumber}' 中的出生日期无效。`);
    return null;
  }

  // 3. 判断性别 (奇数为男，偶数为女)
  const gender = Number.parseInt(genderCode, 10) % 2 === 0 ? '女' : '男';

  // 4. 格式化并返回结果
  const formattedMonth = String(month).padStart(2, '0');
  const formattedDay = String(day).padStart(2, '0');

  return {
    birthDate: `${year}-${formattedMonth}-${formattedDay}`,
    gender,
  };
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

/**
 * 解析搜索关键词，判断是学号还是姓名
 * @param keyword 搜索关键词
 * @returns 返回解析后的学号和姓名字段
 */
export function parseSearchKeyword(keyword?: string) {
  if (!keyword || keyword.trim() === '') {
    return { studentNo: undefined, name: undefined };
  }

  const trimmedKeyword = keyword.trim();

  // 判断是否为学号的特征：
  // 1. 纯数字
  // 2. 以数字开头
  const isStudentNo = /^\d+$/.test(trimmedKeyword);

  // 如果符合学号特征，则赋值给学号字段，否则认为是姓名
  return isStudentNo
    ? { studentNo: trimmedKeyword, name: undefined }
    : { studentNo: undefined, name: trimmedKeyword };
}

/** 生成年份 */
export function generateYearOptions(suffix: string) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - 2019 + 1 }, (_, index) => {
    const year = String(currentYear - index);
    return { label: `${year}${suffix}`, value: year };
  });
}

/** 获取今年年份 */
export function getCurrentYear() {
  return new Date().getFullYear();
}

/**
 * 将数字转换为中文序号（1 -> 一，2 -> 二，...）
 * @param num 数字
 * @returns 中文序号
 */
export function toChineseNumber(num: number): string {
  const cnNums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (typeof num !== 'number' || num <= 0) return '';
  if (num < 10) return cnNums[num] || '';
  if (num === 10) return '十';
  if (num > 10 && num < 20) {
    const ones = num % 10;
    return `十${ones === 0 ? '' : cnNums[ones] || ''}`;
  }
  if (num >= 20 && num < 100) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return `${cnNums[tens] || ''}十${ones === 0 ? '' : cnNums[ones] || ''}`;
  }
  return String(num);
}
