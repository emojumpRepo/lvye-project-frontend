import type { AssessmentTask } from '@vben/types'
import { http } from '@/http/http'

/**
 * 获取我的测评任务列表
 */
export function getMyAssessmentTask() {
  return http.get<AssessmentTask[]>(
    '/psychology/assessment-task/my-tasks',
  )
}
