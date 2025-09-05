import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import pdfMake from 'pdfmake/build/pdfmake';

import * as vfs_fonts from '../../../../static/fonts/vfs_fonts';

const fonts = {
  AlibabaPuHuiTi: {
    bold: 'Alibaba-PuHuiTi-Medium.ttf',
    normal: 'Alibaba-PuHuiTi-Regular.ttf',
  },
};

pdfMake.vfs = vfs_fonts;
pdfMake.fonts = fonts;

/**
 * 导出整体测评报告 PDF
 * 仅展示各问卷结果中的 reportContent 字段
 * @param {object} params 参数对象
 * @param {Array<any>} params.questionnaireResult 问卷结果数据（AssessmentQuestionnaireResultVO[]）
 * @param {Array<any>} params.questionnaireAnswer 答题记录数据（不再展示，仅兼容入参）
 * @param {string|number|Date} params.completedTime 完成时间
 * @param {string} params.studentName 学生姓名
 */
export async function exportQuestionnaireReportToPDF({
  questionnaireResult,
  questionnaireAnswer, // QuestionnaireAnswerItem[]：包含每个问卷的题目与答案
  completedTime,
  studentName,
}) {
  try {
    // 格式化完成时间
    const completedTimeStr = dayjs(completedTime).format(
      'YYYY年MM月DD日 HH:mm:ss',
    );

    // 生成文件名：学生名_整体测评报告.pdf
    const finalFilename = `${studentName || '未知'}_整体测评报告.pdf`;

    // 定义文档内容
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      defaultStyle: {
        font: 'AlibabaPuHuiTi',
        fontSize: 12,
        lineHeight: 1.5,
      },
      content: [
        // 报告标题
        { text: '整体测评报告', style: 'header' },
        // 问卷信息
        {
          text: `作答人：${studentName || '未知'}    完成时间：${completedTimeStr}`,
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        // 问卷结果报告（遍历问卷数组/单个问卷），并在每个问卷后附上作答记录
        ...generateQuestionnaireReportContents(
          questionnaireResult,
          questionnaireAnswer,
        ),
      ],
      styles: {
        header: {
          fontSize: 24,
          bold: true,
          alignment: 'center',
        },
        subheader: {
          fontSize: 16,
          bold: true,
          color: '#1966FF',
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'black',
          fillColor: '#f0f0f0',
          alignment: 'center',
        },
        tableCell: {
          fontSize: 12,
          alignment: 'center',
        },
        questionText: {
          fontSize: 12,
          bold: true,
          margin: [0, 5, 0, 5],
          lineHeight: 1.4,
        },
        answerText: {
          fontSize: 11,
          margin: [20, 2, 0, 2],
        },
        scoreText: {
          fontSize: 11,
          bold: true,
        },
        dimensionHeader: {
          fontSize: 14,
          bold: true,
          margin: [0, 5, 0, 5],
        },
        dimensionContent: {
          fontSize: 12,
          margin: [0, 5, 0, 15],
        },
        dimensionStatus: {
          fontSize: 12,
          color: '#666',
          margin: [0, 7, 0, 5],
        },
      },
      footer(currentPage, pageCount) {
        return {
          text: `第 ${currentPage} 页，共 ${pageCount} 页`,
          alignment: 'center',
          fontSize: 10,
          margin: [0, 10, 0, 0],
        };
      },
    };

    // 生成 PDF
    const pdfDoc = pdfMake.createPdf(docDefinition);

    // 下载文件
    pdfDoc.download(finalFilename);

    message.success('PDF 导出成功');
  } catch (error) {
    console.error('PDF 导出失败:', error);
    message.error('PDF 导出失败，请重试');
    throw error;
  }
}

// 将 1-based 数字转换为中文序号（1 -> 一，2 -> 二 ... 21 -> 二十一）
function toChineseSectionNumber(num) {
  const cnNums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (typeof num !== 'number' || num <= 0) return '';
  if (num < 10) return cnNums[num];
  if (num === 10) return '十';
  if (num > 10 && num < 20) {
    const ones = num % 10;
    return `十${ones === 0 ? '' : cnNums[ones]}`;
  }
  if (num >= 20 && num < 100) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return `${cnNums[tens]}十${ones === 0 ? '' : cnNums[ones]}`;
  }
  return String(num);
}

/**
 * 生成问卷报告内容：遍历问卷数组并拼接维度分析与对应作答记录
 */
function generateQuestionnaireReportContents(questionnaireResults, questionnaireAnswerItems) {
  let resultsArray = [];
  if (Array.isArray(questionnaireResults)) {
    resultsArray = questionnaireResults;
  } else if (questionnaireResults) {
    resultsArray = [questionnaireResults];
  }

  if (resultsArray.length === 0) {
    return [
      {
        text: '暂无问卷结果数据',
        italic: true,
        color: '#666',
        margin: [0, 20, 0, 20],
      },
    ];
  }

  const contents = [];
  resultsArray.forEach((qr, idx) => {
    const section = toChineseSectionNumber(idx + 1);
    const title = `${section}、${qr?.questionnaireName ? `${qr.questionnaireName}问卷` : '问卷'}维度分析`;
    contents.push({
      text: title,
      style: 'subheader',
      margin: [0, idx === 0 ? 0 : 10, 0, 6],
    });
    const dimBlocks = generateDimensionResults(qr);
    contents.push(...dimBlocks);

    // 附：该问卷的作答记录
    const relatedAnswerItem = findRelatedAnswerItem(qr, questionnaireAnswerItems);
    if (relatedAnswerItem) {
      contents.push({
        text: '作答记录',
        style: 'subheader',
        margin: [0, 6, 0, 6],
      });
      contents.push(...generateAnswerSection(relatedAnswerItem));
    }
  });

  return contents;
}

/**
 * 生成维度分析结果内容（支持传入单个问卷或问卷数组）
 */
function generateDimensionResults(questionnaireResults) {
  let resultsArray = [];
  if (Array.isArray(questionnaireResults)) {
    resultsArray = questionnaireResults;
  } else if (questionnaireResults) {
    resultsArray = [questionnaireResults];
  }

  if (resultsArray.length === 0) {
    return [
      {
        text: '暂无维度分析数据',
        italic: true,
        color: '#666',
        margin: [0, 0, 0, 20],
      },
    ];
  }

  const content = [];

  resultsArray.forEach((qr) => {
    let dimensions = [];
    try {
      const parsed =
        typeof qr?.reportContent === 'string'
          ? JSON.parse(qr.reportContent || 'null')
          : qr?.reportContent;
      if (Array.isArray(parsed)) {
        dimensions = parsed;
      } else if (parsed && Array.isArray(parsed?.dimensions)) {
        dimensions = parsed.dimensions;
      } else if (parsed && Array.isArray(parsed?.dimensionList)) {
        dimensions = parsed.dimensionList;
      }
    } catch {
      dimensions = [];
    }

    if (
      dimensions.length === 0 &&
      qr &&
      qr.dimensionScores &&
      typeof qr.dimensionScores === 'object'
    ) {
      dimensions = Object.entries(qr.dimensionScores).map(([name, score]) => ({
        dimensionName: name,
        score,
      }));
    }

    if (dimensions.length === 0) {
      content.push({
        text: '暂无维度分析数据',
        italic: true,
        color: '#666',
        margin: [0, 0, 0, 10],
      });
      return;
    }

    dimensions.forEach((dimension, index) => {
      // 创建包含维度信息和状态的表格行
      const dimensionRow = [];

      // 左侧：维度名称和分数
      dimensionRow.push({
        text: `${index + 1}. ${dimension.dimensionName || dimension.name || '未知维度'}（${dimension.score || 0}分）`,
        style: 'dimensionHeader',
      });

      // 右侧：状态信息
      if (dimension.isAbnormal === 0 || dimension.isAbnormal === 1) {
        dimensionRow.push({
          text: `状态：${dimension.isAbnormal === 1 ? '异常' : '正常'}`,
          style: 'dimensionStatus',
          alignment: 'right',
        });
      } else {
        dimensionRow.push({ text: '', alignment: 'right' });
      }

      content.push({
        table: {
          widths: ['*', 'auto'],
          body: [dimensionRow],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 5],
      });

      if (dimension.studentComment) {
        content.push(
          {
            text: `(1) 学生自评`,
            style: {
              fontSize: 12,
              bold: true,
            },
          },
          {
            text: `${dimension.studentComment}`,
            style: 'dimensionContent',
          },
        );
      }

      if (dimension.teacherComment) {
        content.push(
          {
            text: `(2) 教师评价`,
            style: {
              fontSize: 12,
              bold: true,
            },
          },
          {
            text: `${dimension.teacherComment}`,
            style: 'dimensionContent',
          },
        );
      }

      content.push({
        text: '',
        margin: [0, 0, 0, 10],
      });
    });
  });

  return content;
}

/**
 * 在结果问卷与答案问卷中建立关联（优先按 questionnaireId，其次按名称）
 */
function findRelatedAnswerItem(resultItem, questionnaireAnswerItems) {
  if (!resultItem || !questionnaireAnswerItems || questionnaireAnswerItems.length === 0) {
    return null;
  }
  const byId = questionnaireAnswerItems.find(
    (qa) => qa && qa.questionnaireId === resultItem.questionnaireId,
  );
  if (byId) return byId;
  const byName = questionnaireAnswerItems.find(
    (qa) => qa && qa.questionnaireName === resultItem.questionnaireName,
  );
  return byName || null;
}

/**
 * 生成单个问卷的作答记录内容（逐题）
 * @param {object} answerItem { questionnaireName, questionnaireId, answers: Question[] }
 */
function generateAnswerSection(answerItem) {
  const questions = Array.isArray(answerItem?.answers) ? answerItem.answers.filter(Boolean) : [];
  if (questions.length === 0) {
    return [
      {
        text: '暂无答题记录',
        italic: true,
        color: '#666',
        margin: [0, 0, 0, 10],
      },
    ];
  }

  const content = [];

  // 统计信息
  const totalScore = questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0);
  const totalCount = questions.length;
  const answeredCount = questions.filter(
    (q) => typeof q.answer === 'string' && q.answer.trim() !== '',
  ).length;
  const unansweredCount = totalCount - answeredCount;

  content.push({
    table: {
      widths: ['25%', '25%', '25%', '25%'],
      body: [
        [
          { text: '总分', style: 'tableHeader' },
          { text: '答题数', style: 'tableHeader' },
          { text: '已答题', style: 'tableHeader' },
          { text: '未答题', style: 'tableHeader' },
        ],
        [
          { text: totalScore.toString(), style: 'tableCell' },
          { text: totalCount.toString(), style: 'tableCell' },
          { text: answeredCount.toString(), style: 'tableCell' },
          { text: unansweredCount.toString(), style: 'tableCell' },
        ],
      ],
    },
    margin: [0, 0, 0, 10],
  });

  // 详细题目
  questions.forEach((q, index) => {
    const displayAnswer = getDisplayAnswerForQuestion(q);
    content.push({
      table: {
        widths: ['90%', '10%'],
        body: [
          [
            {
              text: `第${index + 1}题：${q.title || ''}`,
              style: 'questionText',
              margin: [0, 0, 10, 5],
            },
            {
              text: `得分：${q && q.score ? q.score : 0}`,
              style: 'scoreText',
              margin: [0, 0, 0, 10],
              alignment: 'right',
            },
          ],
          [
            {
              text: `答案：${displayAnswer}`,
              style: 'answerText',
              colSpan: 2,
            },
            {},
          ],
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 6],
    });
  });

  return content;
}

function getDisplayAnswerForQuestion(question) {
  if (!question || !question.answer) return '未作答';
  if (question.type === 'checkbox') {
    return (
      question.answer
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => formatAnswer(s))
        .join('，') || '未作答'
    );
  }
  return formatAnswer(question.answer);
}

function _htmlToPlainText(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replaceAll(/<br\s*\/?>/gi, '\n')
    .replaceAll(/<p\b[^>]*>/gi, '')
    .replaceAll(/<\/p>/gi, '\n')
    .replaceAll(/<li\b[^>]*>/gi, '• ')
    .replaceAll(/<\/li>/gi, '\n')
    .replaceAll(/<ul\b[^>]*>|<\/ul>/gi, '')
    .replaceAll(/<ol\b[^>]*>|<\/ol>/gi, '')
    .replaceAll(/<h[1-6]\b[^>]*>/gi, '')
    .replaceAll(/<\/h[1-6]>/gi, '\n')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 生成答题记录内容
 */
function _generateAnswerRecords(questionnaireAnswer) {
  if (!questionnaireAnswer || questionnaireAnswer.length === 0) {
    return [
      {
        text: '暂无答题记录',
        italic: true,
        color: '#666',
        margin: [0, 0, 0, 20],
      },
    ];
  }

  const content = [];

  // 展开新结构：QuestionnaireAnswerItem[] -> Question[]
  const allQuestions = questionnaireAnswer
    .flatMap((qa) => (Array.isArray(qa.answers) ? qa.answers : []))
    .filter(Boolean);

  function getDisplayAnswer(question) {
    if (!question || !question.answer) return '未作答';
    if (question.type === 'checkbox') {
      return (
        question.answer
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => formatAnswer(s))
          .join('，') || '未作答'
      );
    }
    return formatAnswer(question.answer);
  }

  // 统计信息
  const totalScore = allQuestions.reduce(
    (sum, q) => sum + (Number(q.score) || 0),
    0,
  );
  const totalCount = allQuestions.length;
  const answeredCount = allQuestions.filter(
    (q) => typeof q.answer === 'string' && q.answer.trim() !== '',
  ).length;
  const unansweredCount = totalCount - answeredCount;

  content.push({
    table: {
      widths: ['25%', '25%', '25%', '25%'],
      body: [
        [
          { text: '总分', style: 'tableHeader' },
          { text: '答题数', style: 'tableHeader' },
          { text: '已答题', style: 'tableHeader' },
          { text: '未答题', style: 'tableHeader' },
        ],
        [
          { text: totalScore.toString(), style: 'tableCell' },
          { text: totalCount.toString(), style: 'tableCell' },
          { text: answeredCount.toString(), style: 'tableCell' },
          { text: unansweredCount.toString(), style: 'tableCell' },
        ],
      ],
    },
    margin: [0, 0, 0, 20],
  });

  // 详细答题记录
  allQuestions.forEach((q, index) => {
    const questionNumber = index + 1;
    const displayAnswer = getDisplayAnswer(q);

    content.push({
      table: {
        widths: ['90%', '10%'],
        body: [
          [
            {
              text: `第${questionNumber}题：${q.title || ''}`,
              style: 'questionText',
              margin: [0, 0, 10, 5],
            },
            {
              text: `得分：${q && q.score ? q.score : 0}`,
              style: 'scoreText',
              margin: [0, 0, 0, 10],
              alignment: 'right',
            },
          ],
          [
            {
              text: `答案：${displayAnswer}`,
              style: 'answerText',
              colSpan: 2,
            },
            {},
          ],
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 10],
    });
  });

  return content;
}

/**
 * 格式化答案文本用于PDF显示
 */
export function formatAnswer(answer) {
  if (!answer) return '';
  return answer
    .replaceAll('&lt;=', '≤')
    .replaceAll('&gt;=', '≥')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll(/&le;|&leq;/g, '≤')
    .replaceAll(/&ge;|&geq;/g, '≥')
    .replaceAll('&equals;', '=')
    .replaceAll('&#61;', '=');
}
