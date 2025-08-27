import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import * as XLSX from 'xlsx';

import { getDictLabel } from '#/utils';

// 配置dayjs插件
dayjs.extend(customParseFormat);

/**
 * 学生档案导出字段映射
 */
const STUDENT_EXPORT_COLUMNS = [
  { key: 'name', label: '学生姓名' },
  { key: 'studentNo', label: '学号' },
  { key: 'sex', label: '性别' },
  { key: 'gradeName', label: '年级' },
  { key: 'className', label: '班级' },
  { key: 'psychologicalStatus', label: '心理状态' },
  { key: 'mobile', label: '联系电话' },
  { key: 'graduationStatus', label: '毕业状态' },
  { key: 'homeAddress', label: '家庭住址' },
  { key: 'birthDate', label: '出生日期' },
  { key: 'remark', label: '备注' },
];

/**
 * 格式化学生数据用于导出
 */
function formatStudentDataForExport(
  data: PsychologyStudentProfileApi.StudentProfile[],
): any[] {
  return data.map((student) => {
    const formattedStudent: any = {};

    for (const column of STUDENT_EXPORT_COLUMNS) {
      let value =
        student[column.key as keyof PsychologyStudentProfileApi.StudentProfile];

      // 格式化特殊字段
      switch (column.key) {
        case 'birthDate': {
          value = value ? new Date(value).toLocaleDateString('zh-CN') : '---';
          break;
        }
        case 'graduationStatus': {
          value = value === 1 ? '已毕业' : '未毕业';
          break;
        }
        case 'homeAddress':
        case 'remark': {
          value = value || '---';
          break;
        }
        case 'mobile': {
          value = value || '---';
          break;
        }
        case 'psychologicalStatus': {
          switch (value) {
            case 0: {
              value = '一般';

              break;
            }
            case 1: {
              value = '良好';

              break;
            }
            case 2: {
              value = '较差';

              break;
            }
            default: {
              value = '未知';
            }
          }
          break;
        }
        case 'sex': {
          value = getDictLabel('system_user_sex', value);
          break;
        }
        default: {
          // 保持原值
          break;
        }
      }

      formattedStudent[column.label] = value;
    }

    return formattedStudent;
  });
}

/**
 * 导出学生档案为Excel文件
 * @param data 学生数据
 * @param filename 文件名（可选）
 */
export function exportStudentsToExcel(
  data: PsychologyStudentProfileApi.StudentProfile[],
  filename?: string,
): void {
  try {
    if (!data || data.length === 0) {
      message.warning('没有数据可导出');
      return;
    }

    // 格式化数据
    const formattedData = formatStudentDataForExport(data);

    // 创建工作簿
    const workbook = XLSX.utils.book_new();

    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // 设置列宽
    const columnWidths = STUDENT_EXPORT_COLUMNS.map((column) => {
      switch (column.key) {
        case 'birthDate': {
          return { wch: 12 };
        }
        case 'className':
        case 'gradeName':
        case 'sex': {
          return { wch: 8 };
        }
        case 'graduationStatus':
        case 'psychologicalStatus': {
          return { wch: 10 };
        }
        case 'homeAddress': {
          return { wch: 25 };
        }
        case 'mobile': {
          return { wch: 15 };
        }
        case 'name':
        case 'studentNo': {
          return { wch: 12 };
        }
        case 'remark': {
          return { wch: 20 };
        }
        default: {
          return { wch: 10 };
        }
      }
    });

    worksheet['!cols'] = columnWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '学生档案');

    // 生成文件名
    const defaultFilename = `学生档案.xlsx`;
    const finalFilename = filename || defaultFilename;

    // 导出文件
    XLSX.writeFile(workbook, finalFilename);

    message.success(`已导出 ${data.length} 条学生档案数据`);
  } catch (error) {
    console.error('导出失败:', error);
    message.error('导出失败，请重试');
  }
}

/**
 * 下载学生批量导入模板
 */
export function downloadTemplate() {
  // 创建工作簿
  const wb = XLSX.utils.book_new();

  // 创建填写说明工作表
  const instructionData = [
    ['字段名称', '格式要求', '是否必填', '说明', '示例'],
    ['学生名字', '不超过20个字符', '是', '学生的真实姓名', '张三'],
    [
      '学号',
      '数字或字母数字组合，不超过20位',
      '是',
      '学生的唯一标识',
      '2024001',
    ],
    ['性别', '男/女', '是', '只能填写"男"或"女"', '男'],
    ['年级', '数字', '是', '学生所在年级（1-12）', '9'],
    ['班级', '不超过10个字符', '是', '学生所在班级', '1班'],
    ['出生日期', 'YYYY-MM-DD', '是', '日期格式必须为年-月-日', '2008-01-01'],
    ['联系电话', '11位数字', '否', '学生或家长的联系电话', '13800138000'],
    [
      '家庭住址',
      '不超过100个字符',
      '否',
      '学生的详细家庭地址',
      '北京市朝阳区XX街道XX号',
    ],
  ];

  const instructionWs = XLSX.utils.aoa_to_sheet(instructionData);

  // 设置列宽
  instructionWs['!cols'] = [
    { wch: 12 }, // 字段名称
    { wch: 25 }, // 格式要求
    { wch: 10 }, // 是否必填
    { wch: 30 }, // 说明
    { wch: 15 }, // 示例
  ];

  // 设置表头样式（加粗）
  const headerRange = XLSX.utils.decode_range(instructionWs['!ref'] || '');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (instructionWs[cellAddress]) {
      instructionWs[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'F0F0F0' } },
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, instructionWs, '填写说明');

  // 创建学生信息工作表
  const studentData = [
    [
      '学生名字(必填)',
      '学号(必填)',
      '性别(必填)',
      '年级(必填)',
      '班级(必填)',
      '出生日期(必填)',
      '联系电话(选填)',
      '家庭住址(选填)',
    ],
  ];

  const studentWs = XLSX.utils.aoa_to_sheet(studentData);

  // 设置列宽
  studentWs['!cols'] = [
    { wch: 12 }, // 学生名字
    { wch: 12 }, // 学号
    { wch: 8 }, // 性别
    { wch: 8 }, // 年级
    { wch: 10 }, // 班级
    { wch: 12 }, // 出生日期
    { wch: 15 }, // 联系电话
    { wch: 25 }, // 家庭住址
  ];

  // 设置表头样式
  const studentHeaderRange = XLSX.utils.decode_range(studentWs['!ref'] || '');
  for (let col = studentHeaderRange.s.c; col <= studentHeaderRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (studentWs[cellAddress]) {
      studentWs[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E8F4FD' } },
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, studentWs, '学生信息');

  // 生成并下载文件
  const fileName = `学生批量导入模板_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export async function downloadPsychologicalReportTemplate() {
  // 创建文档
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // 标题
          new Paragraph({
            text: '心理评估报告模板',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 400,
            },
          }),

          // 基本信息表格
          new Paragraph({
            text: '一、基本信息',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 400,
              after: 200,
            },
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: '姓名' })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '性别' })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: '年龄' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '年级' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: '班级' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '评估日期' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                ],
              }),
            ],
          }),

          // 评估目的
          new Paragraph({
            text: '二、评估目的',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 400,
              after: 200,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: '本次心理评估的主要目的是：',
                bold: true,
              }),
            ],
            spacing: {
              after: 200,
            },
          }),

          new Paragraph({
            text: '_________________________________________________________________',
            spacing: {
              after: 200,
            },
          }),

          new Paragraph({
            text: '_________________________________________________________________',
            spacing: {
              after: 200,
            },
          }),

          // 评估工具
          new Paragraph({
            text: '三、评估工具',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 400,
              after: 200,
            },
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: '序号' })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '量表名称' })],
                    width: { size: 35, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '适用年龄' })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '评估维度' })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: '1' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: '2' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                ],
              }),
            ],
          }),

          // 评估结果
          new Paragraph({
            text: '四、评估结果',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 400,
              after: 200,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: '4.1 量表得分情况',
                bold: true,
              }),
            ],
            spacing: {
              after: 200,
            },
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: '量表名称' })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '维度' })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '原始分' })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '标准分' })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '等级' })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '_________________' })],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: '4.2 结果分析',
                bold: true,
              }),
            ],
            spacing: {
              before: 400,
              after: 200,
            },
          }),

          new Paragraph({
            text: '_________________________________________________________________',
            spacing: {
              after: 200,
            },
          }),

          new Paragraph({
            text: '_________________________________________________________________',
            spacing: {
              after: 200,
            },
          }),

          new Paragraph({
            text: '_________________________________________________________________',
            spacing: {
              after: 200,
            },
          }),

          // 建议与干预
          new Paragraph({
            text: '五、建议与干预',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 400,
              after: 200,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: '5.1 教育建议',
                bold: true,
              }),
            ],
            spacing: {
              after: 200,
            },
          }),

          new Paragraph({
            text: '_________________________________________________________________',
            spacing: {
              after: 200,
            },
          }),

          new Paragraph({
            text: '_________________________________________________________________',
            spacing: {
              after: 200,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: '5.2 干预措施',
                bold: true,
              }),
            ],
            spacing: {
              before: 400,
              after: 200,
            },
          }),

          new Paragraph({
            text: '_________________________________________________________________',
            spacing: {
              after: 200,
            },
          }),

          new Paragraph({
            text: '_________________________________________________________________',
            spacing: {
              after: 200,
            },
          }),

          // 评估师签名
          new Paragraph({
            text: '六、评估师签名',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 400,
              after: 200,
            },
          }),

          new Paragraph({
            text: '评估师：_________________    日期：_________________',
            spacing: {
              after: 200,
            },
          }),

          new Paragraph({
            text: '审核人：_________________    日期：_________________',
            spacing: {
              after: 200,
            },
          }),
        ],
      },
    ],
  });

  // 生成文档并下载
  const blob = await Packer.toBlob(doc);
  const fileName = `心理评估报告模板_${new Date().toISOString().slice(0, 10)}.docx`;

  // 创建下载链接
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
