import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import { getDeptSimpleList } from '#/api/psychology/student-profile';

/**
 * 加载部门列表
 */
export async function loadDeptList() {
  const data = await getDeptSimpleList();
  if (data.length > 0) {
    const filteredData = data.filter((dept) => dept.parentId !== 110);

    const childIds = new Set(filteredData.map((dept) => dept.id));

    const rootDepts = filteredData.filter(
      (dept) =>
        !childIds.has(dept.parentId) ||
        dept.parentId === 0 ||
        dept.parentId === null,
    );

    // 构建树形结构
    const buildTree = (
      parentId: number,
    ): undefined | { label: string; value: number }[] => {
      const children = filteredData
        .filter((dept) => dept.parentId === parentId)
        .map((dept) => ({
          value: dept.id,
          label: dept.name,
        }));

      return children.length > 0 ? children : undefined;
    };

    // 构建最终的树形数据
    const treeData = rootDepts.map((dept) => ({
      value: dept.id,
      label: dept.name,
      children: buildTree(dept.id),
    }));

    sessionStorage.setItem('deptList', JSON.stringify(treeData));
    return treeData;
  }

  return [];
}

// 格式化小学年级班级名称，如“一年级(3)班”等简化为“3班”
function simplifyClassName(name: string): string {
  if (!name) return '';
  // 先匹配括号中的内容（支持中英文括号），末尾可有“班”字
  const m1 = name.match(/[（(]\s*([0-9一二三四五六七八九十]+)\s*[)）]\s*班?$/);
  if (m1 && m1[1]) return `${m1[1]}班`;
  // 再匹配直接以“X班”结尾的场景
  const m2 = name.match(/([0-9一二三四五六七八九十]+)\s*班$/);
  if (m2 && m2[1]) return `${m2[1]}班`;
  return name;
}

/**
 * 计算部门树形结构
 */
export function getDeptTreeList() {
  const storedDeptList = sessionStorage.getItem('deptList');
  if (!storedDeptList) return [];

  const treeData = JSON.parse(storedDeptList) || loadDeptList();

  return treeData.map((dept: any) => ({
    id: dept.value,
    name: dept.label,
    classDeptId: dept.value,
    gradeDeptId: null,
    amount: 0,
    hasChild: true,
  }));
}

// 格式化部门列表为树形结构
export function formatDeptListToTree(
  studentList: PsychologyStudentProfileApi.StudentProfile[],
) {
  // 按 gradeDeptId 分组
  const gradeGroups = new Map<
    number,
    PsychologyStudentProfileApi.StudentProfile[]
  >();

  // 遍历学生列表，按 gradeDeptId 分组
  studentList.forEach((student) => {
    const gradeDeptId = student.gradeDeptId;
    if (gradeDeptId !== undefined && !gradeGroups.has(gradeDeptId)) {
      gradeGroups.set(gradeDeptId, []);
    }
    if (gradeDeptId !== undefined) {
      const listForGrade = gradeGroups.get(gradeDeptId);
      if (listForGrade) listForGrade.push(student);
    }
  });

  const result: any[] = [];

  // 为每个年级创建分组节点
  gradeGroups.forEach((students, _gradeDeptId) => {
    if (students.length > 0) {
      const firstStudent = students[0];
      if (firstStudent && firstStudent.gradeDeptId !== undefined) {
        // 添加年级分组节点
        result.push({
          name: firstStudent.gradeName,
          classDeptId: firstStudent.gradeDeptId,
          gradeDeptId: null,
          amount: students.length,
          id: firstStudent.gradeDeptId,
          isGroup: true, // 标记为分组节点
        });

        // 添加该年级下的所有班级和学生
        const classGroups = new Map<
          number,
          PsychologyStudentProfileApi.StudentProfile[]
        >();

        // 按 classDeptId 分组
        students.forEach((student) => {
          const classDeptId = student.classDeptId;
          if (classDeptId !== undefined && !classGroups.has(classDeptId)) {
            classGroups.set(classDeptId, []);
          }
          if (classDeptId !== undefined) {
            const listForClass = classGroups.get(classDeptId);
            if (listForClass) listForClass.push(student);
          }
        });

        // 为每个班级创建节点
        classGroups.forEach((classStudents, _classDeptId) => {
          if (classStudents.length > 0) {
            const firstClassStudent = classStudents[0];
            if (
              firstClassStudent &&
              firstClassStudent.classDeptId !== undefined
            ) {
              // 添加班级节点
              result.push({
                name: simplifyClassName(firstClassStudent.className as string),
                classDeptId: firstClassStudent.classDeptId,
                gradeDeptId: firstClassStudent.gradeDeptId,
                amount: classStudents.length,
                id: firstClassStudent.classDeptId,
                isClass: true, // 标记为班级节点
                parentId: firstStudent.gradeDeptId, // 设置父级ID
              });

              // 添加该班级下的所有学生
              classStudents.forEach((student) => {
                result.push({
                  name: student.name,
                  classDeptId: student.id,
                  gradeDeptId: student.classDeptId,
                  studentNo: student.studentNo,
                  id: student.id,
                  parentId: firstClassStudent.classDeptId, // 设置父级ID
                });
              });
            }
          }
        });
      }
    }
  });

  return {
    list: result,
    total: result.length,
  };
}
