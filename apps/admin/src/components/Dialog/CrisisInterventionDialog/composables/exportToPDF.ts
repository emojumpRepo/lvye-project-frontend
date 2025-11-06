import type { InterventionPlan } from '@vben/types';

import dayjs from 'dayjs';
import pdfMake from 'pdfmake/build/pdfmake';

import { toChineseNumber } from '#/utils/calculateTool';
import { getDictLabel } from '#/utils/dict';

const fonts = {
  AlibabaPuHuiTi: {
    bold: 'Alibaba-PuHuiTi-Medium.ttf',
    normal: 'Alibaba-PuHuiTi-Regular.ttf',
  },
};

// 字体缓存变量
let fontsLoaded = false;
let fontLoadingPromise: null | Promise<void> = null;

// 外部字体CDN地址
const VFS_FONTS_URL =
  'https://6d65-mentor-3gyob3y3bdbc2bdb-1305613707.tcb.qcloud.la/lvye/vfs_fonts.js';

/**
 * 动态加载字体文件
 */
function loadVfsFonts(): Promise<void> {
  // 如果已经加载过，直接返回
  if (fontsLoaded) {
    return Promise.resolve();
  }

  // 如果正在加载，返回现有的Promise
  if (fontLoadingPromise) {
    return fontLoadingPromise;
  }

  fontLoadingPromise = new Promise((resolve, reject) => {
    try {
      // 创建script标签动态加载字体
      const script = document.createElement('script');
      script.src = VFS_FONTS_URL;
      script.addEventListener('load', () => {
        try {
          // 检查全局变量是否存在
          if ((window as any).vfs) {
            (pdfMake as any).vfs = (window as any).vfs;
            (pdfMake as any).fonts = fonts;
            fontsLoaded = true;
            resolve();
          } else {
            reject(new Error('字体文件加载失败：未找到vfs数据'));
          }
        } catch (error: any) {
          reject(new Error(`字体初始化失败：${error.message}`));
        }
      });
      script.addEventListener('error', () => {
        reject(new Error('字体文件加载失败：网络错误'));
      });

      // 添加到head中开始加载
      document.head.append(script);
    } catch (error: any) {
      reject(new Error(`字体加载异常：${error.message}`));
    }
  });

  return fontLoadingPromise;
}

/**
 * 生成干预计划PDF
 */
export async function exportInterventionPlanToPDF(
  interventionPlan: InterventionPlan,
  studentName: string,
  attachmentInfoMap: Map<number, { fileIds: number[]; name: string }>, // stepId -> { name, fileIds }
): Promise<{ blob: Blob; filename: string }> {
  try {
    // 动态加载字体文件
    await loadVfsFonts();

    // 格式化时间
    const createTimeStr = dayjs(interventionPlan.createTime).format(
      'YYYY年MM月DD日 HH:mm:ss',
    );

    // 获取状态文本
    const statusText =
      interventionPlan.status === 1
        ? '进行中'
        : interventionPlan.status === 2
          ? '已完成'
          : '未知';

    // 定义文档内容
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      defaultStyle: {
        font: 'AlibabaPuHuiTi',
        fontSize: 12,
        lineHeight: 1.5,
      },
      content: [
        // 报告标题
        {
          text: '干预计划报告',
          style: 'header',
        },

        // 基本信息区域
        {
          text: '基本信息',
          style: 'sectionTitle',
          margin: [0, 20, 0, 10],
        },
        {
          table: {
            widths: ['25%', '75%'],
            body: [
              [
                { text: '学生姓名', style: 'tableLabel' },
                { text: studentName || '-', style: 'tableValue' },
              ],
              [
                { text: '计划标题', style: 'tableLabel' },
                { text: interventionPlan.title || '-', style: 'tableValue' },
              ],
              [
                { text: '创建人', style: 'tableLabel' },
                {
                  text: interventionPlan.creatorName || '-',
                  style: 'tableValue',
                },
              ],
              [
                { text: '创建时间', style: 'tableLabel' },
                { text: createTimeStr, style: 'tableValue' },
              ],
              [
                { text: '计划状态', style: 'tableLabel' },
                { text: statusText, style: 'tableValue' },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e8e8e8',
            vLineColor: () => '#e8e8e8',
          },
        },

        // 关联事件区域
        {
          text: '关联事件',
          style: 'sectionTitle',
          margin: [0, 20, 0, 10],
        },
        ...(interventionPlan.relativeEvents &&
        interventionPlan.relativeEvents.length > 0
          ? [
              {
                ul: interventionPlan.relativeEvents.map((event) => ({
                  text: `【${event.label || getDictLabel('crisis_event_report_source', event.sourceType) || '未知类型'}】${event.eventId || '-'}`,
                  style: 'listItem',
                })),
                margin: [20, 0, 0, 0],
              },
            ]
          : [
              {
                text: '暂无关联事件',
                style: 'emptyText',
                margin: [0, 0, 0, 10],
              },
            ]),

        // 干预步骤区域
        {
          text: '干预步骤',
          style: 'sectionTitle',
          margin: [0, 20, 0, 10],
        },
        ...(interventionPlan.steps && interventionPlan.steps.length > 0
          ? interventionPlan.steps.flatMap((step, index) => {
              const stepStatusText =
                step.status === 1
                  ? '待处理'
                  : step.status === 2
                    ? '处理中'
                    : step.status === 3
                      ? '已完成'
                      : '未知';

              const attachmentInfo = attachmentInfoMap.get(step.id);
              const attachmentNames = attachmentInfo?.name
                ? attachmentInfo.name.split(',').filter(Boolean)
                : [];

              const chineseNumber = toChineseNumber(index + 1);

              return [
                {
                  text: `步骤${chineseNumber}：${step.title || '未命名步骤'}（${stepStatusText}）`,
                  style: 'stepTitle',
                  margin: [0, index === 0 ? 0 : 15, 0, 8],
                },
                {
                  ul: [
                    [
                      { text: '教师笔记：', style: 'fieldLabel' },
                      {
                        text: step.notes || '暂无笔记',
                        style: 'fieldValue',
                      },
                    ],
                    { text: '', margin: [0, 15, 0, 0] },
                    [
                      { text: '附件列表：', style: 'fieldLabel' },
                      {
                        text:
                          attachmentNames.length > 0
                            ? attachmentNames
                                .map((name, i) => `(${i + 1}) ${name}`)
                                .join('\n')
                            : '暂无附件',
                        style: 'fieldValue',
                      },
                    ],
                  ],
                  margin: [20, 0, 0, 0],
                },
              ];
            })
          : [
              {
                text: '暂无干预步骤',
                style: 'emptyText',
                margin: [0, 0, 0, 10],
              },
            ]),
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 10],
        },
        sectionTitle: {
          fontSize: 16,
          bold: true,
          color: '#1966FF',
        },
        stepTitle: {
          fontSize: 14,
          bold: true,
          color: '#333',
        },
        fieldLabel: {
          fontSize: 12,
          bold: true,
          color: '#666',
        },
        fieldValue: {
          fontSize: 12,
          color: '#333',
        },
        tableLabel: {
          fontSize: 12,
          bold: true,
          fillColor: '#f5f5f5',
        },
        tableValue: {
          fontSize: 12,
        },
        listItem: {
          fontSize: 12,
          margin: [0, 3, 0, 3],
        },
        emptyText: {
          fontSize: 12,
          color: '#999',
          italics: true,
        },
      },
      footer(currentPage: number, pageCount: number) {
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

    // 返回 Blob 对象
    return new Promise((resolve) => {
      pdfDoc.getBlob((blob: Blob) => {
        resolve({
          blob,
          filename: `干预计划(${interventionPlan.interventionId})-${studentName}.pdf`,
        });
      });
    });
  } catch (error: any) {
    console.error('PDF 生成失败:', error);
    throw new Error(`PDF 生成失败: ${error.message}`);
  }
}
