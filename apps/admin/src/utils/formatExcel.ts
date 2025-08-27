import { ref } from 'vue';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import XLSX from 'xlsx';

import { loadDeptList } from './transformDeptToTree';

type ValidationError = { field: keyof typeof _rules | string; message: string };

interface StudentRecord {
  studentNo?: string;
  name?: string;
  birthDate?: string;
  sex?: string;
  gradeDeptId?: number;
  classId?: number;
  mobile?: string;
  homeAddress?: string;
}

const deptList = ref();

// 计算字符串长度（兼容中英文）
function getStringLength(value: string): number {
  return [...(value ?? '')].length;
}

async function getDeptList() {
  const storedDeptList = localStorage.getItem('deptList');
  deptList.value = storedDeptList
    ? JSON.parse(storedDeptList)
    : await loadDeptList();
}

const _rules = {
  studentNo: {
    required: true,
    validator: (value: unknown): boolean => {
      if (typeof value !== 'string' || !value.trim()) return false;
      return /^[a-z0-9]+$/i.test(value.trim());
    },
    message: '学号仅支持数字或字母数字组合',
  },
  name: {
    required: true,
    validator: (value: unknown): boolean => {
      if (typeof value !== 'string') return false;
      const len = getStringLength(value.trim());
      return len >= 2 && len <= 10;
    },
    message: '姓名应为2-10个字符',
  },
  birthDate: {
    required: true,
    validator: (value: string): boolean => {
      if (typeof value !== 'string') return false;
      const s = value.trim();
      const re = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
      if (!re.test(s)) return false;
      const [y, m, d] = s.split('/').map((x) => Number.parseInt(x, 10));
      if (!y || !m || !d) return false;
      const dt = dayjs(`${y}-${m}-${d}`);
      return dt.isValid();
    },
    message: '出生日期需为YYYY/M/D且为有效日期',
  },
  sex: {
    required: true,
    validator: (value: string): boolean => {
      return value === '男' || value === '女';
    },
    message: '性别只能为男或女',
  },
  gradeDeptName: {
    required: true,
    validator: (value: string): boolean => {
      return deptList.value?.find((g: any) => g && g.label === value);
    },
    message: '年级不存在',
  },
  className: {
    required: true,
    validator: (gradeName: string, className: string): boolean => {
      if (!gradeName || !className) return false;
      const grade = deptList.value?.find(
        (g: any) => g && g.label === gradeName,
      );
      if (!grade) return false;
      const children = grade.children;
      if (!children) return false;
      return children?.find((c: any) => c && c.label === className);
    },
    message: '班级不存在',
  },
  mobile: {
    required: false,
    validator: (value: unknown): boolean => {
      if (value === undefined || value === null || value === '') return true;
      if (typeof value !== 'string') return false;
      return /^\d{11}$/.test(value.trim());
    },
    message: '联系电话需为11位数字',
  },
  homeAddress: {
    required: false,
    validator: (value: unknown): boolean => {
      if (value === undefined || value === null || value === '') return true;
      if (typeof value !== 'string') return false;
      return getStringLength(value.trim()) >= 200;
    },
    message: '家庭住址字数应不少于200字符',
  },
};

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param value 日期值
 * @returns 格式化后的日期字符串
 */
function formatDate(value: any): string {
  if (!value) return '';

  try {
    // 如果是字符串，尝试解析
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      if (!trimmedValue) return '';

      // 专门处理 YYYY/M/D 格式（如：2000/1/15）
      const ymdPattern = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;
      const ymdMatch = trimmedValue.match(ymdPattern);
      if (ymdMatch && ymdMatch[1] && ymdMatch[2] && ymdMatch[3]) {
        const year = Number.parseInt(ymdMatch[1]);
        const month = Number.parseInt(ymdMatch[2]);
        const day = Number.parseInt(ymdMatch[3]);

        // 使用dayjs验证日期有效性
        const date = dayjs(`${year}-${month}-${day}`);
        if (date.isValid()) {
          return date.format('YYYY-MM-DD');
        }
      }

      // 尝试多种日期格式
      const dateFormats = [
        'YYYY/M/D',
        'YYYY/MM/DD',
        'YYYY-M-D',
        'YYYY-MM-DD',
        'M/D/YYYY',
        'MM/DD/YYYY',
        'M-D-YYYY',
        'MM-DD-YYYY',
        'YYYY年M月D日',
        'YYYY年MM月DD日',
      ];

      for (const format of dateFormats) {
        const date = dayjs(trimmedValue, format);
        if (date.isValid()) {
          return date.format('YYYY-MM-DD');
        }
      }

      // 如果解析失败，返回原值
      return trimmedValue;
    }

    // 如果是数字（Excel日期序列号）
    if (typeof value === 'number') {
      // Excel日期从1900年1月1日开始，需要转换
      // dayjs可以处理Excel日期序列号
      const date = dayjs('1900-01-01').add(value - 2, 'day');
      if (date.isValid()) {
        return date.format('YYYY-MM-DD');
      }
      return String(value);
    }

    // 如果是Date对象
    if (value instanceof Date) {
      const date = dayjs(value);
      if (date.isValid()) {
        return date.format('YYYY-MM-DD');
      }
      return String(value);
    }

    return String(value);
  } catch (error) {
    console.warn('日期格式化失败:', value, error);
    return String(value);
  }
}

/**
 * 解析Excel文件
 * @param file 文件
 * @param options 选项
 * @param options.filterEmptyRows 是否过滤空行
 * @param options.formatDates 是否格式化日期字段
 * @param options.hasHeader 是否有表头
 * @param options.maxRows 最大读取行数
 * @param options.sheetIndex 工作表索引
 * @returns 解析后的数据
 */
export async function parseExcel(
  file: File,
  options: {
    filterEmptyRows?: boolean; // 是否过滤空行
    formatDates?: boolean; // 是否格式化日期字段，默认true
    hasHeader?: boolean; // 是否有表头
    maxRows?: number; // 最大读取行数
    sheetIndex?: number; // 工作表索引，默认0
  } = {},
): Promise<{
  data: any[][];
  headers: string[];
  sheetName: string;
  totalRows: number;
}> {
  const {
    filterEmptyRows = true,
    formatDates = true,
    hasHeader = true,
    maxRows,
    sheetIndex = 0,
  } = options;

  // 默认返回的空结果
  const emptyResult = {
    data: [],
    headers: [],
    sheetName: '',
    totalRows: 0,
  };

  try {
    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });

    // 验证工作表索引
    if (sheetIndex >= workbook.SheetNames.length) {
      message.error(
        `工作表索引 ${sheetIndex} 超出范围，文件只有 ${workbook.SheetNames.length} 个工作表`,
      );
      return emptyResult;
    }

    const sheetName = workbook.SheetNames[sheetIndex];
    if (!sheetName) {
      message.error('工作表名称为空');
      return emptyResult;
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      message.error(`无法读取工作表: ${sheetName}`);
      return emptyResult;
    }

    // 将工作表转换为JSON数组
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    }) as any[][];

    if (!jsonData || jsonData.length === 0) {
      message.warning('工作表为空，没有数据可读取');
      return emptyResult;
    }

    let processedData = jsonData;

    // 过滤空行
    if (filterEmptyRows) {
      processedData = processedData.filter((row: any[]) => {
        if (!row || row.length === 0) return false;

        return row.some((cell: any) => {
          if (cell === null || cell === undefined) return false;
          if (typeof cell === 'string') return cell.trim() !== '';
          return true;
        });
      });
    }

    // 限制最大行数
    if (maxRows && processedData.length > maxRows) {
      processedData = processedData.slice(0, maxRows);
      console.warn(`数据行数超过限制，只读取前 ${maxRows} 行`);
    }

    // 分离表头和数据
    let headers: string[] = [];
    let dataRows: any[][] = [];

    if (hasHeader && processedData.length > 0) {
      const firstRow = processedData[0];
      if (firstRow && firstRow.length > 0) {
        headers = firstRow.map((cell: any) => String(cell || ''));
        dataRows = processedData.slice(1);
      }
    } else {
      // 没有表头，生成默认列名
      if (processedData.length > 0) {
        const maxCols = Math.max(
          ...processedData.map((row: any[]) => row?.length || 0),
        );
        headers = Array.from({ length: maxCols }, (_, i) => `列${i + 1}`);
        dataRows = processedData;
      }
    }

    // 日期字段检测和格式化
    if (formatDates && dataRows.length > 0 && headers.length > 0) {
      // 预计算日期字段索引，避免重复查找
      const dateFieldIndices = headers
        .map((header, index) =>
          header.toLowerCase().includes('出生日期') ? index : -1,
        )
        .filter((index) => index !== -1);

      if (dateFieldIndices.length > 0) {
        // 检测并格式化日期字段
        const formattedDataRows = dataRows.map((row, rowIndex) => {
          return row.map((cell: any, colIndex: number) => {
            // 只处理已知的日期字段
            if (dateFieldIndices.includes(colIndex)) {
              const formattedDate = formatDate(cell);
              if (formattedDate !== cell) {
                console.warn(
                  `第${rowIndex + 1}行，字段"${headers[colIndex]}"：${cell} → ${formattedDate}`,
                );
              }
              return formattedDate;
            }
            return cell;
          });
        });

        dataRows = formattedDataRows;
      }
    }

    const result = {
      data: dataRows,
      headers,
      sheetName,
      totalRows: dataRows.length,
    };
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('Excel解析失败:', error);
    message.error(`Excel解析失败：${errorMessage}`);
    return emptyResult;
  }
}

// =============================
// 基于 rules 的校验实现
// =============================

export async function validateStudentRecord(
  record: StudentRecord,
): Promise<{ errors: ValidationError[]; valid: boolean }> {
  const errors: ValidationError[] = [];

  // 必填校验
  if (!record.studentNo) {
    errors.push({ field: 'studentNo', message: '学号为必填项' });
  }
  if (!record.name) {
    errors.push({ field: 'name', message: '姓名为必填项' });
  }
  if (!record.birthDate) {
    errors.push({ field: 'birthDate', message: '出生日期为必填项' });
  }
  if (!record.sex) errors.push({ field: 'sex', message: '性别为必填项' });
  if (record.gradeDeptId === undefined || record.gradeDeptId === null)
    errors.push({ field: 'gradeDeptId', message: '年级为必填项' });
  if (record.classId === undefined || record.classId === null)
    errors.push({ field: 'classId', message: '班级为必填项' });

  // 格式/取值校验
  if (
    record.studentNo !== undefined &&
    _rules.studentNo.validator(record.studentNo) === false
  ) {
    errors.push({
      field: 'studentNo',
      message: '学号仅支持数字或字母数字组合',
    });
  }

  if (
    record.name !== undefined &&
    _rules.name.validator(record.name) === false
  ) {
    errors.push({ field: 'name', message: _rules.name.message });
  }

  if (
    record.birthDate !== undefined &&
    _rules.birthDate.validator(record.birthDate) === false
  ) {
    errors.push({
      field: 'birthDate',
      message: _rules.birthDate.message,
    });
  }

  if (record.sex !== undefined && _rules.sex.validator(record.sex) === false) {
    errors.push({ field: 'sex', message: _rules.sex.message });
  }

  if (_rules.mobile.validator(record.mobile) === false) {
    errors.push({ field: 'mobile', message: _rules.mobile.message });
  }

  if (_rules.homeAddress.validator(record.homeAddress) === false) {
    errors.push({
      field: 'homeAddress',
      message: _rules.homeAddress.message,
    });
  }
  return { valid: errors.length === 0, errors };
}

/**
 * 批量校验记录
 * @param records 待校验的数据数组
 * @returns 包含成功(success)与失败(failed)结果
 */
export async function validateStudentRecords(records: any[]): Promise<{
  failed: { errors: ValidationError[]; record: any }[];
  success: any[];
}> {
  const failed: { errors: ValidationError[]; record: any }[] = [];
  const success: any[] = [];

  // 确保部门树可用（年级/班级校验需要）
  if (!Array.isArray(deptList.value) || deptList.value.length === 0) {
    await getDeptList();
  }

  for (const record of records) {
    const { valid, errors } = await validateStudentRecord(record);
    if (valid) success.push(record);
    else failed.push({ errors, record });
  }

  return { failed, success };
}
