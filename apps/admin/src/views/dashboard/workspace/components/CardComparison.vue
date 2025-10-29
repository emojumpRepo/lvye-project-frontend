<template>
  <div class="comparison-container">
    <h1 class="page-title">学生信息卡片样式对比</h1>
    
    <!-- 简洁版卡片 -->
    <section class="card-section">
      <h2 class="section-title">简洁版卡片（更接近原图）</h2>
      <div class="cards-row">
        <SimpleStudentCard 
          v-for="student in students" 
          :key="`simple-${student.id}`"
          :student-info="student"
          @click="handleCardClick"
        />
      </div>
    </section>
    
    <!-- 增强版卡片 -->
    <section class="card-section">
      <h2 class="section-title">增强版卡片（带图标和动效）</h2>
      <div class="cards-row">
        <WorkSpaceItem 
          v-for="student in students" 
          :key="`enhanced-${student.id}`"
          :student-info="student"
          @click="handleCardClick"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import WorkSpaceItem from './WorkSpaceItem.vue'
import SimpleStudentCard from './SimpleStudentCard.vue'

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
  }
])

// 处理卡片点击事件
const handleCardClick = (student: Student) => {
  console.log('点击了学生卡片:', student)
}
</script>

<style scoped>
.comparison-container {
  @apply p-6 bg-gray-50 min-h-screen;
}

.page-title {
  @apply text-3xl font-bold text-gray-900 mb-8 text-center;
}

.card-section {
  @apply mb-12;
}

.section-title {
  @apply text-xl font-semibold text-gray-800 mb-4;
}

.cards-row {
  @apply flex flex-wrap gap-6;
}

@media (max-width: 768px) {
  .comparison-container {
    @apply p-4;
  }
  
  .cards-row {
    @apply flex-col items-center gap-4;
  }
}
</style>
