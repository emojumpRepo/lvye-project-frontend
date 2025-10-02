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
  { key: 'idCard', label: '身份证' },
  { key: 'sex', label: '性别' },
  { key: 'ethnicity', label: '民族' },
  { key: 'gradeName', label: '年级' },
  { key: 'className', label: '班级' },
  { key: 'enrollmentYear', label: '届别' },
  { key: 'psychologicalStatus', label: '心理状态' },
  { key: 'mobile', label: '联系电话' },
  { key: 'guardianMobile', label: '监护人联系电话' },
  { key: 'graduationStatus', label: '毕业状态' },
  { key: 'isGraduated', label: '是否毕业' },
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
          value = value ? dayjs(value).format('YYYY-MM-DD') : '--';
          break;
        }
        case 'ethnicity': {
          value = value ? getDictLabel('student_ethnicity', value) : '--';
          break;
        }
        case 'graduationStatus': {
          value =
            getDictLabel('student_graduation_status', String(value)) || '--';
          break;
        }
        case 'guardianMobile': {
          value || '--';
          break;
        }
        case 'homeAddress':
        case 'remark': {
          value = value || '--';
          break;
        }
        case 'isGraduated': {
          value = value === 1 ? '是' : '否';
          break;
        }
        case 'mobile': {
          value = value || '--';
          break;
        }
        case 'psychologicalStatus': {
          value = value
            ? getDictLabel('student_psychological_status', value)
            : '--';
          break;
        }
        case 'sex': {
          value = value ? getDictLabel('system_user_sex', value) : '--';
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
 * @param activeTab 包含当前选项信息
 * @param activeTab.key 选项键，用于区分是否为具体问卷
 * @param activeTab.label 选项名称，作为问卷名称展示
 * @param filename 可选的文件名
 */
export function exportAssessmentParticipantsToExcel(
  data: PsychologyAssessmentApi.ParticipantsQuestionnairePageRes[],
  activeTab: { key: string; label: string },
  filename?: string,
): void {
  try {
    const formattedData = data.map((item) => {
      const rowData: Record<string, any> = {
        测评任务编号: item.taskNo || '--',
      };

      if (activeTab.key) {
        rowData['问卷名称'] = activeTab.label || '--';
      }

      Object.assign(rowData, {
        学生姓名: item.name || '--',
        学号: item.studentNo || '--',
        班级: item.className || '--',
        完成状态: item.status === 1 ? '已完成' : '未完成',
      });

      if (activeTab.key) {
        const isHealthAssessment =
          item.questionnaireName &&
          item.questionnaireName.includes('心理健康评估');

        if (isHealthAssessment) {
          rowData['测评结果'] = item.riskLevel
            ? getDictLabel('questionnaire_result_risk_level', item.riskLevel)
            : '--';
        } else {
          rowData['测评结果'] = item.level || '--';
        }
      } else {
        rowData['总评风险'] = item.riskLevel
          ? getDictLabel('questionnaire_result_risk_level', item.riskLevel)
          : '--';
      }

      rowData['完成时间'] = item.finishTime
        ? dayjs(item.finishTime).format('YYYY-MM-DD HH:mm:ss')
        : '--';

      return rowData;
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    const colWidths = activeTab.key
      ? [
          { wch: 30 }, // 测评任务编号
          { wch: 30 }, // 问卷名称
          { wch: 15 }, // 学生姓名
          { wch: 16 }, // 学号
          { wch: 20 }, // 班级
          { wch: 20 }, // 完成状态
          { wch: 30 }, // 测评结果
          { wch: 35 }, // 完成时间
        ]
      : [
          { wch: 30 }, // 测评任务编号
          { wch: 15 }, // 学生姓名
          { wch: 16 }, // 学号
          { wch: 20 }, // 班级
          { wch: 20 }, // 完成状态
          { wch: 30 }, // 总评风险
          { wch: 35 }, // 完成时间
        ];

    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, '测评结果');

    const defaultFilename = activeTab.key
      ? `${activeTab.label || '问卷'}测评结果.xlsx`
      : `学生总体测评结果.xlsx`;
    const finalFilename = filename || defaultFilename;
    XLSX.writeFile(workbook, finalFilename);
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
    { header: '学生姓名', key: 'name', width: 25 },
    { header: '学号', key: 'studentNo', width: 40 },
    { header: '届别', key: 'enrollmentYear', width: 20 },
    { header: '身份证', key: 'idCard', width: 28 },
    { header: '年级', key: 'gradeName', width: 20 },
    { header: '班级', key: 'className', width: 25 },
    { header: '民族', key: 'ethnicity', width: 20 },
    { header: '联系电话', key: 'mobile', width: 25 },
    { header: '家庭住址', key: 'homeAddress', width: 25 },
    { header: '监护人联系电话', key: 'guardianMobile', width: 30 },
    { header: '备注', key: 'remark', width: 25 },
    { header: '是否毕业', key: 'isGraduated', width: 25 },
  ];

  worksheet.addRow([
    '必填，文本，2-30个字符',
    '必填，数字或字母数字组合，不超过20位',
    '必填，4位数字',
    '必填，中国居民身份证号码',
    '必填，只填写年级',
    '必填，填写年级和班级',
    '选填，汉族/少数民族',
    '选填，个人联系电话，11位数字',
    '选填，不超过200个字符',
    '选填，11位数字',
    '选填，不超过100个字符',
    '选填，是/否，默认为否',
  ]);

  // 设置身份证列为文本格式，防止Excel自动转换
  const idCardColumn = worksheet.getColumn('idCard');
  idCardColumn.numFmt = '@'; // 设置为文本格式

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
