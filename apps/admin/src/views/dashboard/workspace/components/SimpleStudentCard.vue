<template>
  <div 
    :style="cardStyle"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 学生姓名和班级 -->
    <div :style="titleStyle">
      <span :style="studentNameStyle">{{ props.studentInfo.name }}</span>
      <span :style="dividerStyle">|</span>
      <span :style="classNameStyle">{{ props.studentInfo.className }}</span>
    </div>
    
    <!-- 负责人信息 -->
    <div :style="supervisorInfoStyle">
      <span :style="supervisorLabelStyle">负责人：</span>
      <span :style="supervisorNameStyle">{{ props.studentInfo.supervisor }}</span>
    </div>
    
    <!-- 时间信息 -->
    <div :style="timeInfoStyle">
      {{ formatTime(props.studentInfo.time) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface StudentInfo {
  name: string
  className: string
  supervisor: string
  time: string
}

// 通过 props 接收学生信息数据
const props = withDefaults(defineProps<{
  studentInfo?: StudentInfo
}>(), {
  studentInfo: () => ({
    name: '测试4',
    className: '一年级(2)班',
    supervisor: '管理员',
    time: '2025-10-29 05:10:37'
  })
})

// 定义事件
const emit = defineEmits<{
  click: [studentInfo: StudentInfo]
}>()

// 格式化时间显示
const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '-')
}

// 悬停状态
const isHovered = ref(false)

// 处理卡片点击
const handleClick = () => {
  emit('click', props.studentInfo)
}

// 样式定义
const cardStyle = computed(() => ({
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: isHovered.value ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  border: isHovered.value ? '1px solid #d1d5db' : '1px solid #e5e7eb',
  padding: '16px',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  minWidth: '280px',
  maxWidth: '320px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
}))

const titleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '12px'
}

const studentNameStyle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#111827'
}

const dividerStyle = {
  fontSize: '16px',
  fontWeight: '300',
  color: '#d1d5db'
}

const classNameStyle = {
  fontSize: '16px',
  fontWeight: '500',
  color: '#374151'
}

const supervisorInfoStyle = {
  marginBottom: '12px'
}

const supervisorLabelStyle = {
  fontSize: '14px',
  color: '#6b7280'
}

const supervisorNameStyle = {
  fontSize: '14px',
  color: '#374151',
  fontWeight: '500'
}

const timeInfoStyle = {
  fontSize: '13px',
  color: '#9ca3af',
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
}
</script>


