import type { ExportProgress } from '../components/ExportProgressDialog.vue';

import { ref } from 'vue';

import { message } from 'ant-design-vue';
import JSZip from 'jszip';

import { getFileById } from '#/api/infra/file';
import { getInterventionPlan } from '#/api/psychology';

import { exportInterventionPlanToPDF } from './exportToPDF';

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

      // 阶段2: 收集附件信息并准备生成PDF（10-20%）
      progress.value = {
        percentage: 15,
        stage: 'generating',
        message: '正在收集附件信息...',
      };

      // 收集所有附件信息，用于PDF中显示
      const attachmentInfoMap = new Map<
        number,
        { fileIds: number[]; name: string }
      >();

      for (const step of interventionPlan.steps || []) {
        if (step.attachmentIds && step.attachmentIds.length > 0) {
          const fileNames: string[] = [];
          for (const fileId of step.attachmentIds) {
            try {
              const fileInfo = await getFileById(fileId);
              if (fileInfo?.name) {
                fileNames.push(fileInfo.name);
              }
            } catch (error) {
              console.warn(`获取附件信息失败 (ID: ${fileId}):`, error);
            }
          }

          // 即使获取不到文件名，也设置 Map，使用 attachmentIds 作为兜底
          attachmentInfoMap.set(step.id, {
            name:
              fileNames.length > 0
                ? fileNames.join(',')
                : step.attachmentIds.map((id) => `附件${id}`).join(','),
            fileIds: step.attachmentIds,
          });
        }
      }

      progress.value.percentage = 20;

      // 阶段3: 生成PDF（20-40%）
      progress.value = {
        percentage: 25,
        stage: 'generating',
        message: '正在生成PDF文档...',
      };

      const pdfResult = await exportInterventionPlanToPDF(
        interventionPlan,
        studentName,
        attachmentInfoMap,
      );

      // 将PDF添加到ZIP
      zip.file(pdfResult.filename, pdfResult.blob);
      progress.value.percentage = 40;

      // 阶段4: 下载所有步骤的附件（40-90%）
      const steps = interventionPlan.steps || [];
      const totalSteps = steps.length;

      if (totalSteps > 0) {
        // 统计总附件数
        const totalAttachments = steps.reduce(
          (sum, step) => sum + (step.attachmentIds?.length || 0),
          0,
        );

        progress.value = {
          percentage: 40,
          stage: 'downloading',
          message: '正在下载附件...',
          totalFiles: totalAttachments,
          processedFiles: 0,
        };

        let processedFiles = 0;

        for (const step of steps) {
          if (step.attachmentIds && step.attachmentIds.length > 0) {
            for (const fileId of step.attachmentIds) {
              try {
                // 获取文件信息
                const fileInfo = await getFileById(fileId);

                if (fileInfo && fileInfo.url) {
                  progress.value.currentFile = fileInfo.name || '未知文件';

                  // 直接使用URL下载文件
                  const response = await fetch(fileInfo.url);
                  if (!response.ok) {
                    throw new Error(`文件下载失败: ${response.statusText}`);
                  }
                  const fileBlob = await response.blob();

                  // 生成文件名：步骤X-原始文件名
                  const fileName = `步骤${step.sort}-${fileInfo.name || `附件${fileId}`}`;
                  zip.file(fileName, fileBlob);

                  processedFiles++;
                  progress.value.processedFiles = processedFiles;
                  progress.value.percentage =
                    40 + Math.floor((processedFiles / totalAttachments) * 50);
                } else {
                  throw new Error('文件信息不完整');
                }
              } catch (error: any) {
                console.error(
                  `下载附件失败 (步骤: ${step.title}, 文件ID: ${fileId}):`,
                  error,
                );
                failedAttachments.value.push({
                  stepTitle: step.title || '未命名步骤',
                  fileName: `附件ID: ${fileId}`,
                  error: error?.message || '下载失败',
                });

                // 继续处理其他附件
                processedFiles++;
                progress.value.processedFiles = processedFiles;
                progress.value.percentage =
                  40 + Math.floor((processedFiles / totalAttachments) * 50);
              }
            }
          }
        }

        progress.value.percentage = 90;
      } else {
        // 没有步骤，直接跳到90%
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
          `导出完成，但有 ${failedAttachments.value.length} 个附件下载失败，请查看控制台了解详情`,
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
