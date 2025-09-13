import { reactive, ref } from 'vue';

export interface Student {
  class: string;
  label: string;
  name: string;
  studentNo: string;
  value: string;
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

  // 搜索学生（防抖处理）
  const fetchStudents = debounce((searchValue: string) => {
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

    // 模拟API调用
    setTimeout(() => {
      if (fetchId !== lastFetchId) {
        return;
      }

      // 模拟学生数据
      const mockStudents = [
        { name: '张小明', studentNo: '2021001', class: '高一(3)班' },
        { name: '李小红', studentNo: '2021002', class: '高一(2)班' },
        { name: '王小强', studentNo: '2024001', class: '高二(1)班' },
      ].filter(
        (student) =>
          student.name.includes(searchValue) ||
          student.studentNo.includes(searchValue) ||
          student.class.includes(searchValue),
      );

      const data = mockStudents.map((student) => ({
        label: `${student.name}（${student.studentNo}）`,
        value: student.studentNo,
        studentNo: student.studentNo,
        class: student.class,
        name: student.name,
        display: `${student.name} - ${student.class} - ${student.studentNo}`,
      }));

      studentSearchState.data = data;
      studentSearchState.fetching = false;
    }, 300);
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

      // 检查是否为自己负责的学生
      const responsibleNos = ['2021001', '2021002'];
      studentWarning.value = responsibleNos.includes(selectedStudent.value)
        ? ''
        : '⚠️ 该学生非您负责，确认需要预约吗？';
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
