import type { ExportProgress } from '../components/ExportProgressDialog.vue';

import { ref } from 'vue';

import { message } from 'ant-design-vue';
import JSZip from 'jszip';

import { getFileById } from '#/api/infra/file';
import { getInterventionPlan } from '#/api/psychology';

import { exportInterventionPlanToPDF } from './exportToPDF';

// 定义一个更结构化的附件信息类型，包含原始 fileInfo
type AttachmentInfo = {
  downloadInfos: Array<{
    id: number;
    name: string;
    url: string;
  }>; // 实际用于下载的文件信息列表
  fileIds: number[];
  fileName: string; // 用于PDF展示的附件名称（可能是多个用逗号分隔）
};

export function useExportInterventionPlan() {
  // 进度状态
  const progress = ref<ExportProgress>({
    percentage: 0,
    stage: 'fetching',
    message: '准备导出...',
  });

  // 失败的附件记录
  const failedAttachments = ref<
    Array<{ error: string; fileName: string; stepTitle: string }>
  >([]);

  /**
   * 导出干预计划为ZIP
   */
  async function exportInterventionPlanAsZip(
    interventionPlanId: number,
    studentName: string,
  ) {
    try {
      // 重置状态
      failedAttachments.value = [];
      progress.value = {
        percentage: 0,
        stage: 'fetching',
        message: '正在获取干预计划数据...',
      };

      const zip = new JSZip();

      // 阶段1: 获取干预计划详情数据（0-10%）
      progress.value.percentage = 5;
      const interventionPlan = await getInterventionPlan(interventionPlanId);

      if (!interventionPlan) {
        throw new Error('获取干预计划数据失败');
      }

      progress.value.percentage = 10;

      // 阶段2: 收集附件信息（包括下载URL）并准备生成PDF（10-20%）
      progress.value = {
        percentage: 15,
        stage: 'generating',
        message: '正在收集附件信息...',
      };

      // Map<stepId, AttachmentInfo>
      const attachmentInfoMap = new Map<number, AttachmentInfo>();

      // 用于并发请求 Promise 的数组
      const allFileIdPromises: Promise<{
        fileInfo: any;
        stepId: number;
        stepTitle: string;
      }>[] = [];

      // 收集所有需要查询的文件ID和关联的步骤信息
      for (const step of interventionPlan.steps || []) {
        if (step.attachmentIds && step.attachmentIds.length > 0) {
          // 初始化 Map 结构
          attachmentInfoMap.set(step.id, {
            fileName: '',
            fileIds: step.attachmentIds,
            downloadInfos: [],
          });

          step.attachmentIds.forEach((fileId) => {
            allFileIdPromises.push(
              (async () => {
                // 并发请求文件信息
                const fileInfo = await getFileById(fileId);
                return {
                  fileInfo,
                  stepId: step.id,
                  stepTitle: step.title || '未命名步骤',
                };
              })(),
            );
          });
        }
      }

      // **使用 Promise.allSettled 批量、并发地获取所有文件信息**
      const results = await Promise.allSettled(allFileIdPromises);

      // 处理并发结果，构建 attachmentInfoMap
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.fileInfo) {
          const { fileInfo, stepId, stepTitle } = result.value;

          const currentInfo = attachmentInfoMap.get(stepId) || {
            fileName: '',
            fileIds: [],
            downloadInfos: [],
          };

          // 记录用于PDF展示的文件名
          currentInfo.fileName +=
            (currentInfo.fileName ? ',' : '') +
            (fileInfo.name || `附件${fileInfo.id}`);

          // 记录用于下载的完整信息（确保有url）
          if (fileInfo.url) {
            currentInfo.downloadInfos.push({
              id: fileInfo.id,
              name: fileInfo.name || `附件${fileInfo.id}`,
              url: fileInfo.url,
            });
          } else {
            // 文件信息不完整，记录为下载失败（虽然此时还没开始下载）
            failedAttachments.value.push({
              stepTitle,
              fileName: fileInfo.name || `附件ID: ${fileInfo.id}`,
              error: '文件URL缺失，无法下载',
            });
          }
        } else if (result.status === 'rejected') {
          // 处理获取文件信息时的失败（例如API错误）
          const errorValue = result.reason?.message || '获取信息失败';
          console.error('获取附件信息时失败:', result.reason);
          failedAttachments.value.push({
            stepTitle: '未知步骤',
            fileName: `附件ID: 未知`,
            error: errorValue,
          });
        }
      }

      // 优化 PDF 附件名称：使用实际获取到的文件名，或 ID 兜底
      for (const [_stepId, info] of attachmentInfoMap.entries()) {
        if (!info.fileName) {
          // 如果一个文件名都没获取到，使用 ID 兜底
          info.fileName = info.fileIds.map((id) => `附件${id}`).join(',');
        }
      }

      progress.value.percentage = 20;

      // 阶段3: 生成PDF（20-40%）
      progress.value = {
        percentage: 25,
        stage: 'generating',
        message: '正在生成PDF文档...',
      };

      // 调整传递给 PDF 函数的 Map 格式，只保留 name 和 fileIds，确保兼容性
      const pdfAttachmentMap = new Map<
        number,
        { fileIds: number[]; name: string }
      >();
      for (const [stepId, info] of attachmentInfoMap.entries()) {
        pdfAttachmentMap.set(stepId, {
          name: info.fileName,
          fileIds: info.fileIds,
        });
      }

      const pdfResult = await exportInterventionPlanToPDF(
        interventionPlan,
        studentName,
        pdfAttachmentMap,
      );

      // 将PDF添加到ZIP
      zip.file(pdfResult.filename, pdfResult.blob);
      progress.value.percentage = 40;

      // 阶段4: 下载所有步骤的附件（40-90%）
      const allDownloadFiles = [...attachmentInfoMap.values()].flatMap(
        (info) => info.downloadInfos,
      );
      const totalAttachments = allDownloadFiles.length; // 只有具备完整信息的附件才会被尝试下载

      if (totalAttachments > 0) {
        progress.value = {
          percentage: 40,
          stage: 'downloading',
          message: '正在下载附件...',
          totalFiles: totalAttachments,
          processedFiles: 0,
        };

        let processedFiles = 0;

        // 循环所有可下载的文件
        for (const fileInfo of allDownloadFiles) {
          // 找到文件所属步骤的标题和排序号
          const step = interventionPlan.steps?.find((s) =>
            s.attachmentIds?.includes(fileInfo.id),
          );
          const stepTitle = step?.title || '未命名步骤';

          try {
            progress.value.currentFile = fileInfo.name || '未知文件';

            // 直接使用URL下载文件 (阶段2已确认URL存在)
            const response = await fetch(fileInfo.url);
            if (!response.ok) {
              throw new Error(`文件下载失败: ${response.statusText}`);
            }
            const fileBlob = await response.blob();

            // 生成文件名：步骤X-原始文件名
            const stepSort = step?.sort || 'N';
            const fileName = `步骤${stepSort}-${fileInfo.name}`;
            zip.file(fileName, fileBlob);

            processedFiles++;
            progress.value.processedFiles = processedFiles;
            progress.value.percentage =
              40 + Math.floor((processedFiles / totalAttachments) * 50);
          } catch (error: any) {
            console.error(
              `下载附件失败 (步骤: ${stepTitle}, 文件ID: ${fileInfo.id}):`,
              error,
            );
            failedAttachments.value.push({
              stepTitle,
              fileName: fileInfo.name || `附件ID: ${fileInfo.id}`,
              error: error?.message || '下载失败',
            });

            // 继续处理其他附件，更新进度
            processedFiles++;
            progress.value.processedFiles = processedFiles;
            progress.value.percentage =
              40 + Math.floor((processedFiles / totalAttachments) * 50);
          }
        }

        progress.value.percentage = 90;
      } else {
        // 没有附件需要下载（或全部信息缺失），直接跳到90%
        progress.value.percentage = 90;
      }

      // 阶段5: 打包压缩（90-100%）
      progress.value = {
        percentage: 92,
        stage: 'packaging',
        message: '正在打包压缩...',
      };

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      progress.value.percentage = 95;

      // 生成ZIP文件名和下载URL
      const fileName = `干预计划(${interventionPlan.interventionId})-${studentName}.zip`;
      const downloadUrl = URL.createObjectURL(zipBlob);

      progress.value.percentage = 100;

      // 完成
      progress.value = {
        percentage: 100,
        stage: 'completed',
        message: '导出完成！',
        downloadUrl,
        fileName,
      };

      // 显示导出结果
      if (failedAttachments.value.length > 0) {
        console.warn('部分附件下载失败:', failedAttachments.value);
        message.warning(
          `导出完成，但有 ${failedAttachments.value.length} 个附件下载失败，请查看详情`,
        );
      } else {
        message.success('导出成功！');
      }
    } catch (error: any) {
      console.error('导出失败:', error);
      progress.value = {
        percentage: 0,
        stage: 'fetching',
        message: '导出失败',
      };
      message.error(error?.message || '导出失败，请重试');
    }
  }

  return {
    progress,
    failedAttachments,
    exportInterventionPlanAsZip,
  };
}
