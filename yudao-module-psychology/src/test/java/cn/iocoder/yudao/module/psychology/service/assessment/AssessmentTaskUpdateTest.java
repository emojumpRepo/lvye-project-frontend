package cn.iocoder.yudao.module.psychology.service.assessment;

import cn.iocoder.yudao.framework.test.core.ut.BaseDbUnitTest;
import cn.iocoder.yudao.module.psychology.controller.admin.assessment.vo.AssessmentTaskSaveReqVO;
import cn.iocoder.yudao.module.psychology.dal.dataobject.assessment.AssessmentTaskDO;
import cn.iocoder.yudao.module.psychology.dal.mysql.assessment.AssessmentTaskMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;

import javax.annotation.Resource;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 测评任务更新功能测试
 */
@Import(AssessmentTaskServiceImpl.class)
public class AssessmentTaskUpdateTest extends BaseDbUnitTest {

    @Resource
    private AssessmentTaskService assessmentTaskService;

    @Resource
    private AssessmentTaskMapper assessmentTaskMapper;

    @MockBean
    private AssessmentScenarioService scenarioService;

    @Test
    public void testUpdateAssessmentTask() {
        // 1. 准备测试数据 - 创建一个测评任务
        AssessmentTaskDO originalTask = new AssessmentTaskDO();
        originalTask.setTaskNo("TASK_TEST_001");
        originalTask.setTaskName("原始任务名称");
        originalTask.setTargetAudience(0); // 学生
        originalTask.setStatus(0); // 未开始
        originalTask.setStartline(new Date());
        originalTask.setDeadline(new Date(System.currentTimeMillis() + 86400000)); // 明天
        originalTask.setDescription("原始任务描述");
        assessmentTaskMapper.insert(originalTask);

        // 2. 准备更新数据
        AssessmentTaskSaveReqVO updateReqVO = new AssessmentTaskSaveReqVO();
        updateReqVO.setId(originalTask.getId());
        updateReqVO.setTaskNo("TASK_TEST_001");
        updateReqVO.setTaskName("更新后的任务名称");
        updateReqVO.setTargetAudience(1); // 家长
        updateReqVO.setStartline(new Date());
        updateReqVO.setDeadline(new Date(System.currentTimeMillis() + 172800000)); // 后天
        updateReqVO.setDescription("更新后的任务描述");
        updateReqVO.setQuestionnaireIds(List.of(1L, 2L, 3L));

        // 3. 执行更新
        assessmentTaskService.updateAssessmentTask(updateReqVO);

        // 4. 验证更新结果
        AssessmentTaskDO updatedTask = assessmentTaskMapper.selectById(originalTask.getId());
        assertNotNull(updatedTask);
        assertEquals("更新后的任务名称", updatedTask.getTaskName());
        assertEquals(Integer.valueOf(1), updatedTask.getTargetAudience());
        assertEquals("更新后的任务描述", updatedTask.getDescription());
        
        System.out.println("测评任务更新测试通过！");
        System.out.println("原始任务名称: " + originalTask.getTaskName());
        System.out.println("更新后任务名称: " + updatedTask.getTaskName());
        System.out.println("原始描述: " + originalTask.getDescription());
        System.out.println("更新后描述: " + updatedTask.getDescription());
    }

    @Test
    public void testUpdateAssessmentTaskWithValidation() {
        // 测试更新时的验证逻辑
        AssessmentTaskSaveReqVO updateReqVO = new AssessmentTaskSaveReqVO();
        updateReqVO.setTaskNo("NOT_EXISTS_TASK");
        updateReqVO.setTaskName("测试任务");

        // 应该抛出任务不存在的异常
        assertThrows(Exception.class, () -> {
            assessmentTaskService.updateAssessmentTask(updateReqVO);
        });
    }
}
