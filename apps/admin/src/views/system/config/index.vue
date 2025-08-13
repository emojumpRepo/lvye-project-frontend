<template>
  <Page auto-content-height>

  <div class="flex  bg-[#f7f8fb] p-6">
    <!-- 左侧导航栏 -->
    <div class="w-[228px] bg-white border-r border-[#f2f3f5] flex-shrink-0">
      <div class="p-6 border-b border-[#f2f3f5]">
        <h3 class="m-0 text-[16px] font-600 text-black">业务规则配置</h3>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="inline"
        class="config-menu"
      >
        <a-menu-item key="school">
          <div class="flex items-center justify-between relative">
            <span>学校个性化配置</span>
            <div class="absolute right-[-24px] w-[3px] h-10 bg-[#04dc70]"></div>
          </div>
        </a-menu-item>
        <a-menu-item key="intervention">
          <span>干预管理设置</span>
        </a-menu-item>
        <a-menu-item key="notification">
          <span>通知策略配置</span>
        </a-menu-item>
        <a-menu-item key="password">
          <span>学生密码管理</span>
        </a-menu-item>
      </a-menu>
    </div>

    <!-- 右侧内容区域 -->
    <div class="flex-1 p-[24px_67px_50px_37px] bg-[linear-gradient(180deg,#ffffff4d_0%,#f7f8fa_22.19%,#f7f8fa_100%)]">
      <div class="mb-[29px]">
        <div class="w-[2px] h-[14px] bg-[#04dc70] mb-[10px]"></div>
        <h2 class="m-0 mb-[12px] text-[20px] font-600 text-black leading-[20px]">学校个性化配置</h2>
        <p class="m-0 text-[13px] text-[#979899] leading-[13px]">学校基本信息和组织架构配置</p>
      </div>

      <div class="bg-white rounded-[12px] p-0 overflow-hidden">
        <div class="flex items-center gap-[10px] p-6 m-0">
          <div class="w-[2px] h-[14px] bg-[#04dc70]"></div>
          <span class="text-[16px] font-600 text-black">学校基本信息</span>
        </div>

        <a-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          layout="vertical"
          class="p-[0_24px_36px]"
        >
          <!-- 学校名称 -->
          <div class="mb-6">
            <a-form-item
              name="schoolName"
              label="学校名称"
              class="form-item"
            >
              <a-input
                v-model:value="formData.schoolName"
                placeholder="请输入学校名称"
              />
            </a-form-item>
            <div class="mb-6">
              <p class="m-0 mb-2 text-[12px] text-[#979899] leading-[12px]">显示在系统各处的学校名称</p>
              <div class="flex items-center gap-[6px]">
                <span class="text-[12px] text-[#979899]">影响范围：</span>
                <span class="text-[12px] text-[#979899]">系统标题、登录页面、报告抬头</span>
              </div>
            </div>
            <div class="h-[2px] bg-[#e9e9e9] my-6"></div>
          </div>

          <!-- 系统欢迎词 -->
          <div class="mb-6">
            <a-form-item
              name="welcomeMessage"
              label="系统欢迎词"
              class="form-item"
            >
              <a-input
                v-model:value="formData.welcomeMessage"
                placeholder="请输入系统欢迎词"
              />
            </a-form-item>
            <div class="mb-6">
              <p class="m-0 mb-2 text-[12px] text-[#979899] leading-[12px]">用户登录后显示的欢迎信息</p>
              <div class="flex items-center gap-[6px]">
                <span class="text-[12px] text-[#979899]">影响范围：</span>
                <span class="text-[12px] text-[#979899]">用户登录后的欢迎界面</span>
              </div>
            </div>
            <div class="h-[2px] bg-[#e9e9e9] my-6"></div>
          </div>

          <!-- 学校联系方式 -->
          <div class="mb-6">
            <a-form-item
              name="contactInfo"
              label="学校联系方式"
              class="form-item"
            >
              <a-input
                v-model:value="formData.contactInfo"
                placeholder="请输入学校联系方式"
              />
            </a-form-item>
            <div class="mb-6">
              <p class="m-0 mb-2 text-[12px] text-[#979899] leading-[12px]">学校的联系电话</p>
              <div class="flex items-center gap-[6px]">
                <span class="text-[12px] text-[#979899]">影响范围：</span>
                <span class="text-[12px] text-[#979899]">系统关于页面、紧急联系等</span>
              </div>
            </div>
          </div>
        </a-form>

        <!-- 操作按钮 -->
        <div class="flex justify-center gap-[19px] p-6 mt-[260px]">
          <a-button
            class="w-[100px] h-10 border border-[#eaebed] rounded-md text-[13px] text-[#121413]"
            @click="handleReset"
          >
            恢复默认
          </a-button>
          <a-button
            type="primary"
            class="w-[100px] h-10 rounded-md bg-[#14e77e] border-none text-[13px] text-white hover:bg-[#12d171]!"
            @click="handleSave"
            :loading="saving"
          >
            保存配置
          </a-button>
        </div>
      </div>
    </div>
  </div>
</Page>

</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'

// 类型定义
interface SchoolConfig {
  schoolName: string
  welcomeMessage: string
  contactInfo: string
}

// 响应式数据
const selectedKeys = ref(['school'])
const formRef = ref<FormInstance>()
const saving = ref(false)

// 表单数据
const formData = reactive<SchoolConfig>({
  schoolName: 'xxxxxx中学',
  welcomeMessage: '欢迎使用心理健康咨询管理系统',
  contactInfo: '19202002'
})

// 默认配置
const defaultConfig: SchoolConfig = {
  schoolName: 'xxxxxx中学',
  welcomeMessage: '欢迎使用心理健康咨询管理系统',
  contactInfo: '19202002'
}

// 表单验证规则
const rules = {
  schoolName: [
    { required: true, message: '请输入学校名称', trigger: 'blur' },
    { min: 2, max: 50, message: '学校名称长度应在2-50个字符之间', trigger: 'blur' }
  ],
  welcomeMessage: [
    { required: true, message: '请输入系统欢迎词', trigger: 'blur' },
    { max: 100, message: '欢迎词长度不能超过100个字符', trigger: 'blur' }
  ],
  contactInfo: [
    { required: true, message: '请输入学校联系方式', trigger: 'blur' },
    { pattern: /^[0-9-+()\s]+$/, message: '请输入有效的联系方式', trigger: 'blur' }
  ]
}

// 恢复默认配置
const handleReset = () => {
  Object.assign(formData, defaultConfig)
  message.success('已恢复默认配置')
}

// 保存配置
const handleSave = async () => {
  try {
    await formRef.value?.validate()
    saving.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    message.success('配置保存成功')
  } catch (error) {
    message.error('请检查表单输入')
  } finally {
    saving.value = false
  }
}

// 组件挂载时的初始化
onMounted(() => {
  // 可以在这里加载配置数据
})
</script>

<style scoped>
.config-menu {
  border: none;
}

.config-menu :deep(.ant-menu-item) {
  height: 40px;
  line-height: 40px;
  margin: 0;
  padding: 0 24px;
  color: #979899;
  font-size: 14px;
}

.config-menu :deep(.ant-menu-item:hover) {
  background: #f7f8fb;
}

.config-menu :deep(.ant-menu-item-selected) {
  background: #04dc7014;
  color: #04dc70;
  font-weight: 600;
}

.active-indicator {
  position: absolute;
  right: -24px;
  width: 3px;
  height: 40px;
  background: #04dc70;
}

/* 右侧内容区域样式 */
.content-area {
  flex: 1;
  padding: 24px 67px 50px 37px;
  background: linear-gradient(180deg, #ffffff4d 0%, #f7f8fa 22.19%, #f7f8fa 100%);
}

.content-header {
  margin-bottom: 29px;
}

.header-indicator {
  width: 2px;
  height: 14px;
  background: #04dc70;
  margin-bottom: 10px;
}

.content-header h2 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #000000;
  line-height: 20px;
}

.header-description {
  margin: 0;
  font-size: 13px;
  color: #979899;
  line-height: 13px;
}

.config-form {
  background: #ffffff;
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px;
  margin: 0;
}

.title-indicator {
  width: 2px;
  height: 14px;
  background: #04dc70;
}

.section-title span {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
}

.school-form {
  padding: 0 24px 36px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-item {
  margin-bottom: 12px;
}

.form-item :deep(.ant-form-item-label) {
  padding-bottom: 8px;
}

.form-item :deep(.ant-form-item-label > label) {
  font-size: 14px;
  font-weight: 600;
  color: #000000;
}

.form-input {
  height: 40px;
  border: 1px solid #00000026;
  border-radius: 4px;
  font-size: 14px;
}

.form-description {
  margin-bottom: 24px;
}

.description-text {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #979899;
  line-height: 12px;
}

.impact-scope {
  display: flex;
  align-items: center;
  gap: 6px;
}

.impact-label {
  font-size: 12px;
  color: #979899;
}

.impact-text {
  font-size: 12px;
  color: #979899;
}

.divider {
  height: 2px;
  background: #e9e9e9;
  margin: 24px 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 19px;
  padding: 24px;
  margin-top: 260px;
}

.reset-button {
  width: 100px;
  height: 40px;
  border: 1px solid #eaebed;
  border-radius: 6px;
  font-size: 13px;
  color: #121413;
}

.save-button {
  width: 100px;
  height: 40px;
  border-radius: 6px;
  background: #14e77e;
  border: none;
  font-size: 13px;
  color: #ffffff;
}

.save-button:hover {
  background: #12d171 !important;
}
</style>