import type { DeptGradeClassOption } from '@vben/types';

import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import {
  getDeptById,
  getDeptSimpleList,
  getStudentProfileSimpleList,
} from '#/api/psychology/student-profile';

/**
 * 加载部门列表
 */
export async function loadDeptList() {
  const data = await getDeptSimpleList();
  if (data.length > 0) {
    const filteredData = data.filter(
      (dept) => dept.parentId !== 110 && dept.parentId !== 0,
    );

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
          parentId,
          count: dept.count || 0,
          isClass: true,
        }));

      return children.length > 0 ? children : undefined;
    };

    // 构建最终的树形数据
    const treeData = rootDepts.map((dept) => ({
      value: dept.id,
      label: dept.name,
      parentId: dept.parentId,
      children: buildTree(dept.id),
      count: dept.count || 0,
      isGrade: true,
    }));

    localStorage.setItem('deptList', JSON.stringify(treeData));
    return treeData;
  }

  return [];
}

// 格式化班级名称
export function simplifyClassName(name: string): string {
  if (!name) return '';

  // 匹配年级+括号数字+班的格式
  // 支持：一年级(1)班、初一(1)班、高一(1)班、初二(2)班等
  const m1 = name.match(
    /^([一二三四五六七八九十年级]+)[（(]\s*([0-9一二三四五六七八九十]+)\s*[)）]\s*班?$/,
  );
  if (m1 && m1[1] && m1[2]) {
    return `${m1[1]}(${m1[2]})班`;
  }

  // 匹配直接以"X班"结尾的场景
  const m2 = name.match(/([0-9一二三四五六七八九十]+)\s*班$/);
  if (m2 && m2[1]) return `${m2[1]}班`;

  return name;
}

/**
 * 计算部门树形结构
 */
export async function getDeptTreeList(
  classDeptId?: number,
  hasChild?: boolean,
) {
  const treeData = await loadDeptList();
  if (!treeData || treeData.length === 0) return [];

  if (classDeptId && hasChild) {
    const targetDept = (treeData as any[]).find(
      (dept: any) => dept.value === classDeptId,
    );
    const children = targetDept?.children ?? [];
    if (!Array.isArray(children) || children.length === 0) return [];

    return children.map((child: any) => ({
      id: child.value,
      name: child.label,
      classDeptId: child.value,
      gradeDeptId: classDeptId,
      count: child.count,
      hasChildField: true,
      isClass: true,
    }));
  }

  const allDeptList = treeData
    .map((dept: any) => ({
      id: dept.value,
      name: dept.label,
      classDeptId: dept.value,
      gradeDeptId: dept.parentId ?? null,
      count: dept.count,
      hasChildField: true,
      isGrade: true,
    }))
    .sort((a, b) => a.id - b.id);

  return allDeptList;
}

// 格式化部门列表为树形结构
export async function formatDeptListToTree(
  classDeptId?: number,
  children?: any[] | null,
  name?: string,
) {
  if (classDeptId && children && children.length === 0 && !name) {
    return await getDeptTreeList(classDeptId, true);
  }

  const studentProfileList = await getStudentProfileSimpleList({
    classDeptId,
    name,
  });

  return studentProfileList.map((profile) => ({
    id: profile.id,
    name: profile.name,
    classDeptId: profile.id,
    gradeDeptId: classDeptId,
    studentNo: profile.studentNo,
    userId: profile.userId,
    className: profile.className,
    hasChildField: false,
  }));
}

/**
 * 根据学生姓名获取部门树形结构
 */
export async function getDeptTreeListByStudentName(name: string) {
  if (!name) return [];

  const profile = await getStudentProfileSimpleList({ name });
  if (profile.length === 0) return [];

  // 按班级分组学生
  const studentsByClass = new Map<number, any[]>();

  profile.forEach((profileItem) => {
    if (profileItem.classDeptId) {
      if (!studentsByClass.has(profileItem.classDeptId)) {
        studentsByClass.set(profileItem.classDeptId, []);
      }
      const classStudents = studentsByClass.get(profileItem.classDeptId);
      if (classStudents) {
        classStudents.push(profileItem);
      }
    }
  });

  const deptList: any[] = [];

  // 构建班级 -> 学生的树形结构
  for (const [classDeptId, students] of studentsByClass.entries()) {
    const classDept = await getDeptById(classDeptId);
    if (classDept) {
      const classItem = {
        id: classDept.id,
        name: classDept.name,
        classDeptId: classDept.id,
        gradeDeptId: null, // 班级作为根节点
        count: students.length, // 班级学生人数
        hasChildField: true,
        isClass: true,
        children: students.map((student) => ({
          id: student.id,
          name: student.name,
          classDeptId: student.classDeptId,
          gradeDeptId: classDeptId,
          studentNo: student.studentNo,
          userId: student.userId,
          className: student.className,
          hasChildField: false,
        })),
      };

      deptList.push(classItem);
    }
  }

  return deptList;
}

/**
 * 获取部门列表（缓存）
 */
export async function getDeptListCache(): Promise<
  PsychologyStudentProfileApi.DeptTree[]
> {
  const stored = localStorage.getItem('deptList');
  // 获取班级选项
  if (stored) {
    return JSON.parse(stored);
  } else {
    try {
      return await loadDeptList();
    } catch (error) {
      console.error('加载部门列表失败:', error);
      return [];
    }
  }
}

/**
 * 获取部门年级-班级字典选项
 */
export async function getDeptGradeClassDictOptions(): Promise<
  DeptGradeClassOption[]
> {
  const deptList = await getDeptListCache();
  return deptList?.map((dept) => ({
    label: dept.label,
    value: dept.value,
    children:
      dept.children?.map((cls) => ({
        label: cls.label,
        value: cls.value,
        isLeaf: true,
      })) || [],
  }));
}
