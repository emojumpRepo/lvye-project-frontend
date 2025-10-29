<template>
  <div class="student-cards-container">
    <h2 class="page-title">学生信息卡片</h2>
    
    <div class="cards-grid">
      <WorkSpaceItem 
        v-for="student in students" 
        :key="student.id"
        :student-info="student"
        @click="handleCardClick(student)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import WorkSpaceItem from './WorkSpaceItem.vue'

interface Student {
  id: number
  name: string
  className: string
  supervisor: string
  time: string
}

// 示例学生数据
const students = ref<Student[]>([
  {
    id: 1,
    name: '测试4',
    className: '一年级(2)班',
    supervisor: '管理员',
    time: '2025-10-29 05:10:37'
  },
  {
    id: 2,
    name: '张小明',
    className: '二年级(1)班',
    supervisor: '李老师',
    time: '2025-10-29 08:30:15'
  },
  {
    id: 3,
    name: '王小红',
    className: '三年级(3)班',
    supervisor: '陈老师',
    time: '2025-10-29 09:45:22'
  },
  {
    id: 4,
    name: '刘小华',
    className: '一年级(1)班',
    supervisor: '赵老师',
    time: '2025-10-29 10:20:08'
  }
])

// 处理卡片点击事件
const handleCardClick = (student: Student) => {
  console.log('点击了学生卡片:', student)
  // 这里可以添加路由跳转或弹窗等逻辑
}
</script>

<style scoped>
.student-cards-container {
  @apply p-6 bg-gray-50 min-h-screen;
}

.page-title {
  @apply text-2xl font-bold text-gray-900 mb-6;
}

.cards-grid {
  @apply grid gap-6;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

@media (max-width: 768px) {
  .student-cards-container {
    @apply p-4;
  }
  
  .cards-grid {
    @apply grid-cols-1 gap-4;
  }
}
</style>
