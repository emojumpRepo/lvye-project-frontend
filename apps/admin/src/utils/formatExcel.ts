import { ref } from 'vue';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import { getInfoFromIdCard } from './calculateTool';
import { STUDENT_EXPORT_COLUMNS } from './export';
import { getDeptListCache } from './transformDeptToTree';

// 类型定义
type ValidationError = { field: keyof typeof _rules | string; message: string };

/** 学生数据类型 */
export interface StudentRecord {
  studentNo?: string;
  name?: string;
  idCard?: string;
  birthDate?: string;
  sex?: string;
  gradeName?: string;
  className?: string;
  gradeDeptId?: number;
  classDeptId?: number;
  enrollmentYear?: number;
  graduationStatus?: number;
  isGraduated?: string;
  errorMessage?: string;
  mobile?: string;
  homeAddress?: string;
  rowNumber?: number;
  remark?: string;
}

/** 学生数据结果类型 */
export interface StudentRecordResult {
  success: StudentRecord[];
  failed: StudentRecord[];
  sheetName: string;
  total: number;
}

/** 验证结果类型 */
export interface ValidationResult {
  errors: ValidationError[];
  valid: boolean;
}

/** 批量验证结果类型 */
export interface ValidationRecordResult {
  failed: StudentRecord[];
  success: StudentRecord[];
}

// 部门列表缓存
const deptList = ref<any[]>();
// 身份证正则表达式
const idCardReg =
  /^(?:[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[0-9X]|[1-9]\d{7}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3})$/i;

// 计算字符串长度（支持中文字符）
function getStringLength(value: string): number {
  return [...(value ?? '')].length;
}

// 验证规则配置
const _rules = {
  studentNo: {
    required: true,
    validator: (value: string): boolean => {
      if (!value) return false;
      return /^[a-z0-9]+$/i.test(value);
    },
    message: '学号仅支持数字或字母数字组合',
  },
  name: {
    required: true,
    validator: (value: string): boolean => {
      const len = getStringLength(value);
      return len >= 2 && len <= 30;
    },
    message: '姓名应为2-30个字符',
  },
  idCard: {
    required: true,
    validator: (value: string): boolean => {
      if (!value) return false;
      return idCardReg.test(value);
    },
    message: '身份证格式不正确',
  },
  birthDate: {
    required: false,
    validator: (value: string): boolean => {
      if (!value) return true;
      const re = /^\d{4}-\d{1,2}-\d{1,2}$/;
      if (!re.test(value)) return false;
      const [y, m, d] = value.split('-').map((x) => Number.parseInt(x, 10));
      if (!y || !m || !d) return false;
      const dt = dayjs(`${y}-${m}-${d}`);
      if (!dt.isValid()) return false;

      // 校验年龄在1-30岁之间
      const now = dayjs();
      const age = now.diff(dt, 'year');
      return age >= 1 && age <= 30;
    },
    message: '出生日期需为YYYY-MM-DD且为有效日期，年龄需在1-30岁之间',
  },
  enrollmentYear: {
    required: true,
    validator: (value: number): boolean => {
      if (!value) return false;
      return /^\d{4}$/.test(value.toString());
    },
    message: '届别需为4位数字',
  },
  sex: {
    required: false,
    validator: (value: string): boolean => {
      if (!value) return true;
      return value === '男' || value === '女';
    },
    message: '性别只能为男或女',
  },
  gradeDeptName: {
    required: true,
    validator: (value: string): boolean => {
      if (!deptList.value || !Array.isArray(deptList.value)) return false;
      return deptList.value.some((g: any) => g?.label === value);
    },
    message: '年级不存在',
  },
  className: {
    required: true,
    validator: (gradeName: string, className: string): boolean => {
      if (!gradeName || !className || !deptList.value) return false;
      const grade = deptList.value.find((g: any) => g?.label === gradeName);
      if (!grade?.children) return false;
      return grade.children.some((c: any) => c?.label === className);
    },
    message: '班级不存在',
  },
  isGraduated: {
    required: false,
    validator: (value: string): boolean => {
      if (!value) return true;
      return value === '是' || value === '否';
    },
    message: '就读状态只能为是或否',
  },
  mobile: {
    required: false,
    validator: (value: string): boolean => {
      if (!value) return true; // 非必填字段，空值通过验证
      return /^\d{11}$/.test(value);
    },
    message: '联系电话需为11位数字',
  },
  homeAddress: {
    required: false,
    validator: (value: string): boolean => {
      if (!value) return true; // 非必填字段，空值通过验证
      return getStringLength(value) <= 200;
    },
    message: '家庭住址字数应不超过200字符',
  },
};

/**
 * 验证单个学生记录
 * @param record 学生记录
 * @returns 验证结果
 */
export async function validateStudentRecord(
  record: StudentRecord,
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  // 必填字段验证
  const requiredFields: Array<keyof StudentRecord> = [
    'studentNo',
    'name',
    'gradeName',
    'className',
  ];

  requiredFields.forEach((field) => {
    if (!record[field]) {
      const fieldNames: Record<keyof StudentRecord, string> = {
        studentNo: '学号',
        name: '学生姓名',
        idCard: '身份证',
        birthDate: '出生日期',
        sex: '性别',
        gradeName: '年级',
        className: '班级',
        gradeDeptId: '',
        classDeptId: '',
        enrollmentYear: '届别',
        graduationStatus: '就读状态',
        isGraduated: '是否毕业',
        errorMessage: '',
        mobile: '手机号码',
        homeAddress: '家庭住址',
        rowNumber: '',
        remark: '备注',
      };
      errors.push({ field, message: `${fieldNames[field]}为必填项` });
    }
  });

  // 格式验证
  if (record.studentNo && !_rules.studentNo.validator(record.studentNo)) {
    errors.push({ field: 'studentNo', message: _rules.studentNo.message });
  }

  if (record.name && !_rules.name.validator(record.name)) {
    errors.push({ field: 'name', message: _rules.name.message });
  }

  if (
    record.enrollmentYear &&
    !_rules.enrollmentYear.validator(record.enrollmentYear)
  ) {
    errors.push({
      field: 'enrollmentYear',
      message: _rules.enrollmentYear.message,
    });
  }

  // 年级验证
  if (record.gradeName && !_rules.gradeDeptName.validator(record.gradeName)) {
    errors.push({ field: 'gradeName', message: _rules.gradeDeptName.message });
  }

  // 班级验证（需要年级信息）
  if (
    record.gradeName &&
    record.className &&
    !_rules.className.validator(record.gradeName, record.className)
  ) {
    errors.push({ field: 'className', message: _rules.className.message });
  }

  // 可选字段验证
  if (record.idCard && !_rules.idCard.validator(record.idCard)) {
    errors.push({ field: 'idCard', message: _rules.idCard.message });
  }

  if (record.birthDate && !_rules.birthDate.validator(record.birthDate)) {
    errors.push({ field: 'birthDate', message: _rules.birthDate.message });
  }

  if (record.sex && !_rules.sex.validator(record.sex)) {
    errors.push({ field: 'sex', message: _rules.sex.message });
  }

  if (record.isGraduated && !_rules.isGraduated.validator(record.isGraduated)) {
    errors.push({
      field: 'isGraduated',
      message: _rules.isGraduated.message,
    });
  }

  if (record.mobile && !_rules.mobile.validator(record.mobile)) {
    errors.push({ field: 'mobile', message: _rules.mobile.message });
  }

  if (record.homeAddress && !_rules.homeAddress.validator(record.homeAddress)) {
    errors.push({ field: 'homeAddress', message: _rules.homeAddress.message });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 批量验证学生记录
 * @param records 待验证的数据数组
 * @returns 包含成功与失败结果
 */
export async function validateStudentRecords(
  records: StudentRecord[],
): Promise<ValidationRecordResult> {
  const failed: StudentRecord[] = [];
  const success: StudentRecord[] = [];

  // 确保部门树可用
  if (
    !deptList.value ||
    !Array.isArray(deptList.value) ||
    deptList.value.length === 0
  ) {
    deptList.value = await getDeptListCache();
  }

  for (const record of records) {
    const { valid, errors } = await validateStudentRecord(record);
    if (valid) {
      success.push(record);
    } else {
      // 为失败记录添加错误信息
      const failedRecord = {
        ...record,
        errorMessage: errors.map((e) => `${e.message}`).join('; '),
      };
      failed.push(failedRecord);
    }
  }

  return { failed, success };
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param value 日期值
 * @returns 格式化后的日期字符串
 */
function formatDate(value: any): string {
  if (!value) return '';

  try {
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      if (!trimmedValue) return '';

      const ymdPattern = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;
      const ymdMatch = trimmedValue.match(ymdPattern);
      if (ymdMatch && ymdMatch[1] && ymdMatch[2] && ymdMatch[3]) {
        const year = Number.parseInt(ymdMatch[1]);
        const month = Number.parseInt(ymdMatch[2]);
        const day = Number.parseInt(ymdMatch[3]);

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

      return trimmedValue;
    }

    // 如果是数字（Excel日期序列号）
    if (typeof value === 'number') {
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
 * @param options.maxRows 最大读取行数
 * @param options.sheetIndex 读取的工作表索引，默认0
 * @returns 解析后的数据
 */
export async function parseExcel(
  file: File,
  options: {
    maxRows?: number;
    sheetIndex?: number;
  } = {},
): Promise<StudentRecordResult> {
  const { maxRows, sheetIndex = 0 } = options;

  const emptyResult: StudentRecordResult = {
    success: [],
    failed: [],
    sheetName: '',
    total: 0,
  };

  try {
    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });

    // 验证工作表索引
    if (sheetIndex >= workbook.SheetNames.length) {
      return {
        ...emptyResult,
        failed: [
          {
            studentNo: '',
            name: '',
            errorMessage: `工作表索引 ${sheetIndex} 超出范围，文件只有 ${workbook.SheetNames.length} 个工作表`,
            rowNumber: 1,
          },
        ],
      };
    }

    const sheetName = workbook.SheetNames[sheetIndex];
    if (!sheetName) {
      const errorMsg = '工作表名称为空';
      message.error(errorMsg);
      return {
        ...emptyResult,
        failed: [
          {
            studentNo: '',
            name: '',
            errorMessage: errorMsg,
            rowNumber: 1,
          },
        ],
      };
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      return {
        ...emptyResult,
        failed: [
          {
            studentNo: '',
            name: '',
            errorMessage: `无法读取工作表`,
            rowNumber: 1,
          },
        ],
      };
    }

    // 将工作表转换为JSON数组
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    }) as any[][];

    if (!jsonData || jsonData.length === 0) {
      return {
        ...emptyResult,
        failed: [
          {
            studentNo: '',
            name: '',
            errorMessage: '工作表为空，没有数据可读取',
            rowNumber: 1,
          },
        ],
      };
    }

    // 过滤空行
    let processedData = jsonData.filter((row: any[]) => {
      if (!row || row.length === 0) return false;
      return row.some((cell: any) => {
        if (cell === null || cell === undefined) return false;
        if (typeof cell === 'string') return cell.trim() !== '';
        return true;
      });
    });

    // 限制最大行数
    if (maxRows && processedData.length > maxRows) {
      processedData = processedData.slice(0, maxRows);
      console.warn(`数据行数超过限制，只读取前 ${maxRows} 行`);
    }

    // 分离表头和数据
    let headers: string[] = [];
    let dataRows: any[][] = [];

    if (processedData.length > 0) {
      const firstRow = processedData[0];
      if (firstRow && firstRow.length > 0) {
        headers = firstRow.map((cell: any) => String(cell || ''));
        dataRows = processedData.slice(2);
      } else {
        // 第一行存在但为空，生成默认列名
        const maxCols = Math.max(
          ...processedData.map((row: any[]) => row?.length || 0),
        );
        headers = Array.from({ length: maxCols }, (_, i) => `列${i + 1}`);
        dataRows = processedData;
      }
    }

    // 检查是否有数据行（去除表头后）
    if (dataRows.length === 0) {
      return {
        ...emptyResult,
        failed: [
          {
            studentNo: '',
            name: '',
            errorMessage: '工作表为空，没有数据可读取',
            rowNumber: 1,
          },
        ],
      };
    }

    // 验证必需的表头字段
    const requiredHeaders = [
      '学号',
      '学生姓名',
      '届别',
      '身份证',
      '年级',
      '班级',
      '联系电话',
      '是否毕业',
      '家庭住址',
      '备注',
    ];
    const missingHeaders = requiredHeaders.filter(
      (requiredHeader) =>
        !headers.some(
          (header) =>
            header.trim() === requiredHeader ||
            header.toLowerCase().includes(requiredHeader.toLowerCase()),
        ),
    );

    if (missingHeaders.length > 0) {
      return {
        ...emptyResult,
        failed: [
          {
            studentNo: '',
            name: '',
            errorMessage: `缺少必需的表头字段：${missingHeaders.join('、')}。请确保Excel文件包含这些列。`,
            rowNumber: 1,
          },
        ],
      };
    }

    // 日期字段检测和格式化
    if (dataRows.length > 0 && headers.length > 0) {
      const dateFieldIndices = headers
        .map((header, index) =>
          header.toLowerCase().includes('出生日期') ? index : -1,
        )
        .filter((index) => index !== -1);

      if (dateFieldIndices.length > 0) {
        dataRows = dataRows.map((row) => {
          return row.map((cell: any, colIndex: number) => {
            if (dateFieldIndices.includes(colIndex)) {
              const formattedDate = formatDate(cell);
              return formattedDate;
            }
            return cell;
          });
        });
      }
    }

    // 转换为对象格式
    const objectData: StudentRecord[] = dataRows.map((row, index) => {
      const rowObject: Partial<StudentRecord> = {};
      headers.forEach((header, headerIndex) => {
        const matchedColumn = STUDENT_EXPORT_COLUMNS.find(
          (col) => col.label === header.trim(),
        );
        const key = matchedColumn ? matchedColumn.key : header;
        rowObject[key as keyof StudentRecord] = row[headerIndex] || '';
      });

      // 如果填写了身份证且格式校验通过，则根据身份证回填出生日期与性别
      const idCard = String(rowObject.idCard || '').trim();
      if (idCard && idCardReg.test(idCard)) {
        const info = getInfoFromIdCard(idCard);
        if (info) {
          rowObject.birthDate = info.birthDate;
          rowObject.sex = info.gender;
        }
      }

      // 依据“是否在校”自动计算“毕业状态”
      const computeGraduationStatus = (isGraduated?: string): number => {
        const val = String(isGraduated || '').trim();
        if (!val) return 0; // 未填写默认在校
        return val === '是' ? 0 : 1; // 是=在校(0)，否=毕业(1)
      };

      const graduationStatus = computeGraduationStatus(
        rowObject.isGraduated as string,
      );

      return {
        ...rowObject,
        graduationStatus,
        rowNumber: index + 2,
      } as StudentRecord;
    });

    // 验证数据
    const { failed, success } = await validateStudentRecords(objectData);

    // 为成功记录添加部门ID
    const formatSuccess = success.map((item) => {
      const gradeDept = deptList.value?.find(
        (g: any) => g?.label === item.gradeName,
      );
      const classDept = gradeDept?.children?.find(
        (c: any) => c?.label === item.className,
      );

      return {
        ...item,
        gradeDeptId: gradeDept?.value,
        classDeptId: classDept?.value,
        birthDate: item.birthDate,
        // 再保险：确保毕业状态被设置（当上一步已设置则保持）
        graduationStatus:
          typeof item.graduationStatus === 'number'
            ? item.graduationStatus
            : ((): number => {
                const val = String(item.isGraduated || '').trim();
                if (!val) return 0;
                return val === '是' ? 1 : 0;
              })(),
      };
    });

    return {
      success: formatSuccess,
      failed,
      sheetName,
      total: objectData.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('Excel解析失败:', error);

    return {
      ...emptyResult,
      failed: [
        {
          studentNo: '',
          name: '',
          errorMessage: `Excel解析失败：${errorMessage}`,
          rowNumber: 1,
        },
      ],
    };
  }
}
