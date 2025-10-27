import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { reactive, ref } from 'vue';

import { getStudentProfileSimpleList } from '#/api/psychology/student-profile';

export interface Student {
  class: string;
  label: string;
  name: string;
  studentNo: string;
  value: number;
  display?: string;
}

export interface StudentSearchState {
  data: Student[];
  fetching: boolean;
}

export function useStudentSearch() {
  let lastFetchId = 0;
  const studentSearchState = reactive<StudentSearchState>({
    data: [],
    fetching: false,
  });

  const searchingText = ref('');
  const studentWarning = ref('');

  // 本地防抖函数
  function debounce<T extends (...args: any[]) => any>(fn: T, wait = 300): T {
    let timer: any;
    return ((...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    }) as T;
  }

  // 是否包含中文字符
  function hasChinese(input: string) {
    return /[\u4E00-\u9FA5]/.test(input);
  }

  // 搜索学生（防抖处理）
  const fetchStudents = debounce(async (searchValue: string) => {
    searchingText.value = searchValue;

    if (!searchValue.trim()) {
      studentSearchState.data = [];
      studentSearchState.fetching = false;
      return;
    }

    lastFetchId += 1;
    const fetchId = lastFetchId;
    studentSearchState.data = [];
    studentSearchState.fetching = true;

    try {
      const params: PsychologyStudentProfileApi.StudentProfilePageReq = {
        ...(hasChinese(searchValue)
          ? { name: searchValue }
          : { studentNo: searchValue }),
      };

      const list = await getStudentProfileSimpleList(params);

      if (fetchId !== lastFetchId) return;

      const data: Student[] = (list || [])
        .filter((student) => typeof student.id === 'number')
        .map((student) => ({
          label: `${student.name}（${student.studentNo}）`,
          value: student.id as number,
          studentNo: student.studentNo,
          class: student.className || '',
          name: student.name,
          // 自定义展示字段，供 option 渲染与回填使用
          display: `${student.name} - ${student.className || ''} - ${student.studentNo}`,
        }));

      studentSearchState.data = data;
      console.log('学生搜索数据', studentSearchState.data);
    } finally {
      if (fetchId === lastFetchId) {
        studentSearchState.fetching = false;
      }
    }
  }, 300);

  // 处理学生选择变化
  const handleStudentChange = (selectedStudent: Student | undefined) => {
    if (selectedStudent && typeof selectedStudent === 'object') {
      const matched = studentSearchState.data.find(
        (d) => d.value === selectedStudent.value,
      );
      if (matched && (matched as any).display) {
        (selectedStudent as any).label = (matched as any).display;
      }
    }

    studentSearchState.data = [];
    studentSearchState.fetching = false;
  };

  // 清空搜索状态
  const clearSearchState = () => {
    studentSearchState.data = [];
    studentSearchState.fetching = false;
    searchingText.value = '';
    studentWarning.value = '';
  };

  return {
    studentSearchState,
    searchingText,
    studentWarning,
    fetchStudents,
    handleStudentChange,
    clearSearchState,
  };
}
