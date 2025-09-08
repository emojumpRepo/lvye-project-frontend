import type { PsychologyAssessmentApi } from '#/api/psychology/assessment/index';
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
import * as ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

import { getDictLabel } from '#/utils';

// 配置dayjs插件
dayjs.extend(customParseFormat);

/**
 * 学生档案导出字段映射
 */
export const STUDENT_EXPORT_COLUMNS = [
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
          value = getDictLabel('student_graduation_status', value);
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
          value = getDictLabel('student_psychological_status', value);
          break;
        }
        case 'sex': {
          value = getDictLabel('system_user_sex', value);
          break;
        }
        default: {
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
          return { wch: 20 };
        }
        case 'className':
        case 'gradeName':
        case 'sex': {
          return { wch: 10 };
        }
        case 'graduationStatus':
        case 'psychologicalStatus': {
          return { wch: 10 };
        }
        case 'homeAddress': {
          return { wch: 35 };
        }
        case 'mobile': {
          return { wch: 20 };
        }
        case 'name':
        case 'studentNo': {
          return { wch: 15 };
        }
        case 'remark': {
          return { wch: 30 };
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
 * 将测评任务中选中的学生问卷结果导出为 Excel
 * @param data 学生问卷结果数据（来自测评任务列表勾选项）
 * @param filename 可选的文件名
 */
export function exportAssessmentParticipantsToExcel(
  data: PsychologyAssessmentApi.ParticipantsQuestionnairePageRes[],
  filename?: string,
): void {
  try {
    if (!data || data.length === 0) {
      message.warning('没有数据可导出');
      return;
    }

    const formattedData = data.map((item) => {
      return {
        学生姓名: item.name || '---',
        学号: item.studentNo || '---',
        班级: item.className || '---',
        完成状态: item.status === 1 ? '已完成' : '未完成',
        分数: item.score ?? '--',
        风险等级: item.riskLevel
          ? getDictLabel('questionnaire_result_risk_level', item.riskLevel)
          : '--',
        完成时间: item.finishTime
          ? dayjs(item.finishTime).format('YYYY-MM-DD HH:mm:ss')
          : '--',
        任务编号: item.taskNo || '---',
      } as Record<string, any>;
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // 列宽设置
    worksheet['!cols'] = [
      { wch: 12 }, // 学生姓名
      { wch: 16 }, // 学号
      { wch: 20 }, // 班级
      { wch: 10 }, // 完成状态
      { wch: 10 }, // 分数
      { wch: 12 }, // 风险等级
      { wch: 25 }, // 完成时间
      { wch: 30 }, // 任务编号
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '问卷结果');

    const defaultFilename = `测评问卷结果.xlsx`;
    const finalFilename = filename || defaultFilename;
    XLSX.writeFile(workbook, finalFilename);
    message.success(`已导出 ${data.length} 条问卷结果`);
  } catch (error) {
    console.error('导出失败:', error);
    message.error('导出失败，请重试');
  }
}

/**
 * 下载学生批量导入模板
 */
export async function downloadTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('学生信息');

  worksheet.columns = [
    { header: '学生姓名', key: 'name', width: 20 },
    { header: '学号', key: 'studentId', width: 35 },
    { header: '性别', key: 'sex', width: 10 },
    { header: '年级', key: 'gradeName', width: 15 },
    { header: '班级', key: 'className', width: 20 },
    { header: '出生日期', key: 'birthDate', width: 15 },
    { header: '联系电话', key: 'mobile', width: 20 },
    { header: '家庭住址', key: 'homeAddress', width: 25 },
    { header: '备注', key: 'remark', width: 20 },
  ];

  worksheet.addRow([
    '文本，2-20个字符',
    '数字或字母数字组合，不超过20位',
    '男/女',
    '只填写年级',
    '填写年级和班级',
    'YYYY/M/D',
    '11位数字',
    '不超过200个字符',
    '不超过100个字符',
  ]);

  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  const fileName = `学生批量导入模板_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();

  // 创建一个 Blob 对象
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** 下载心理评估报告模板 */
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
