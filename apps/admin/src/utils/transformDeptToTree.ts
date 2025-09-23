import type { DeptGradeClassOption } from '@vben/types';

import type { PsychologyStudentProfileApi } from '#/api/psychology/student-profile';

import {
  getDeptById,
  getDeptSimpleList,
  getStudentProfileSimpleList,
} from '#/api/psychology/student-profile';

/**
 * 加载部门列表 (支持多级)
 */
export async function loadDeptList() {
  // 假设 getDeptSimpleList 返回类型为 Dept[]
  const data = await getDeptSimpleList();

  if (!data || data.length === 0) {
    return [];
  }

  const filteredData = data;

  const nodeMap = new Map();
  const treeData = [];

  // 2. 第一次遍历：将每个部门转换为树节点，并存入 Map 以便快速查找。
  // 同时为每个节点初始化一个 children 数组。
  for (const dept of filteredData) {
    nodeMap.set(dept.id, {
      value: dept.id,
      label: dept.name,
      parentId: dept.parentId,
      count: dept.count || 0,
      sort: dept.sort || 0,
      children: [], // 先初始化为空数组
    });
  }

  // 3. 第二次遍历：构建父子关系。
  for (const dept of filteredData) {
    const node = nodeMap.get(dept.id);
    if (!node) continue;

    // 判断是否为根节点 (父ID为0, null, 或者在Map中找不到父节点)
    if (
      dept.parentId === null ||
      dept.parentId === 0 ||
      !nodeMap.has(dept.parentId)
    ) {
      treeData.push(node);
    } else {
      // 如果不是根节点，就找到它的父节点，并将自己添加到父节点的 children 中
      const parentNode = nodeMap.get(dept.parentId);
      if (parentNode) {
        parentNode.children?.push(node);
      }
    }
  }

  // 标记各层级的标识，并计算最大层级
  function getMaxDepth(nodes: any[], currentDepth = 1): number {
    if (!Array.isArray(nodes) || nodes.length === 0) return currentDepth - 1;
    let max = currentDepth;
    for (const n of nodes) {
      const depth = getMaxDepth(n.children || [], currentDepth + 1);
      if (depth > max) max = depth;
    }
    return max;
  }

  function labelFlags(nodes: any[], level = 1, maxDepthForMark = 1) {
    for (const n of nodes) {
      // 清理旧标记，避免脏数据
      delete n.isGrade;
      delete n.isDept;
      delete n.isClass;
      if (maxDepthForMark >= 3) {
        if (level === 1) {
          n.isDept = true;
        } else if (level === 2) {
          n.isGrade = true;
        } else {
          // 第三层（及更深层）视为班级
          n.isClass = true;
        }
      } else if (maxDepthForMark === 2) {
        if (level === 1) {
          // 两层结构：第一层为 isGrass
          (n as any).isGrass = true;
        } else {
          n.isClass = true;
        }
      } else {
        // 单层或未知：统一按班级
        n.isClass = true;
      }
      if (Array.isArray(n.children) && n.children.length > 0) {
        labelFlags(n.children, level + 1, maxDepthForMark);
      }
    }
  }

  const maxDepth = getMaxDepth(treeData, 1);
  labelFlags(treeData, 1, maxDepth);

  let finalData: any = treeData;

  // 层级达到三层或以上：提取每个第一层节点的 children 合并为新的第一层
  if (maxDepth >= 3) {
    finalData = (treeData as any[]).flatMap((root: any) =>
      Array.isArray(root.children) ? root.children : [],
    );
  }

  localStorage.setItem('deptList', JSON.stringify(finalData));
  return finalData;
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

    return children
      .map((child: any) => ({
        id: child.value,
        name: child.label,
        classDeptId: child.value,
        gradeDeptId: classDeptId,
        count: child.count,
        sort: child.sort,
        hasChildField: true,
        isClass: true,
      }))
      .sort((a: { sort: number }, b: { sort: number }) => a.sort - b.sort);
  }

  const allDeptList = treeData
    .map((dept: any) => ({
      id: dept.value,
      name: dept.label,
      classDeptId: dept.value,
      gradeDeptId: dept.parentId ?? null,
      count: dept.count,
      sort: dept.sort,
      hasChildField: true,
      isGrade: true,
    }))
    .sort((a: { sort: number }, b: { sort: number }) => a.sort - b.sort);

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
