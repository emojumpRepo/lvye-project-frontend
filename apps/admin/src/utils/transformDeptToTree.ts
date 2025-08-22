import {
  getDeptSimpleList,
  getStudentProfileSimpleList,
} from '#/api/psychology/student-profile';

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
          parentId,
        }));

      return children.length > 0 ? children : undefined;
    };

    // 构建最终的树形数据
    const treeData = rootDepts.map((dept) => ({
      value: dept.id,
      label: dept.name,
      parentId: dept.parentId,
      children: buildTree(dept.id),
    }));

    sessionStorage.setItem('deptList', JSON.stringify(treeData));
    return treeData;
  }

  return [];
}

// 格式化班级名称
function simplifyClassName(name: string): string {
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
  const storedDeptList = sessionStorage.getItem('deptList');
  if (!storedDeptList) return [];

  const treeData = JSON.parse(storedDeptList) || loadDeptList();

  if (classDeptId && hasChild) {
    const targetDept = (treeData as any[]).find(
      (dept: any) => dept.value === classDeptId,
    );
    const children = targetDept?.children ?? [];
    if (!Array.isArray(children) || children.length === 0) return [];

    return children.map((child: any) => ({
      id: child.value,
      name: simplifyClassName(child.label),
      classDeptId: child.value,
      gradeDeptId: classDeptId,
      amount: 0,
      hasChildField: true,
    }));
  }

  return treeData.map((dept: any) => ({
    id: dept.value,
    name: dept.label,
    classDeptId: dept.value,
    gradeDeptId: null,
    amount: 0,
    hasChildField: true,
  }));
}

// 格式化部门列表为树形结构
export async function formatDeptListToTree(
  classDeptId: number,
  children?: any[] | null,
) {
  if (classDeptId && children && children.length === 0) {
    return await getDeptTreeList(classDeptId, true);
  }

  const studentProfileList = await getStudentProfileSimpleList({ classDeptId });

  return studentProfileList.map((profile) => ({
    id: profile.id,
    name: profile.name,
    classDeptId: profile.id,
    gradeDeptId: classDeptId,
    studentNo: profile.studentNo,
    className: profile.className,
    hasChildField: false,
  }));
}
