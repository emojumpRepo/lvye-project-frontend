import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';

import { handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getDeptList } from '#/api/system/dept';
import { getUserRoleList } from '#/api/system/user';
import { CommonStatusEnum, DICT_TYPE, getDictOptions } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'parentId',
      label: '上级部门',
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: async () => {
          const data = await getDeptList();
          data.unshift({
            id: 0,
            name: '顶级部门',
          });
          return handleTree(data);
        },
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择上级部门',
        treeDefaultExpandAll: true,
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'name',
      label: '部门名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入部门名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'sort',
      label: '显示顺序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        controlsPosition: 'right',
        placeholder: '请输入显示顺序',
      },
      rules: 'required',
    },
    {
      fieldName: 'leaderUserIds',
      label: '负责人',
      component: 'ApiSelect',
      componentProps: {
        api: getUserRoleList,
        labelField: 'nickname',
        valueField: 'id',
        placeholder: '请选择负责人',
        allowClear: true,
        required: true,
        mode: 'multiple',
      },
      rules: z
        .array(z.number())
        .min(1, { message: '请至少选择一个负责人' })
        .refine(
          async (userIds) => {
            if (!userIds || userIds.length === 0) {
              return true; // 空值由 min(1) 验证，这里不处理
            }

            try {
              // 获取所有用户的角色信息
              const userList = await getUserRoleList();

              // 统计各角色的数量
              let psychologyTeacherCount = 0;
              let teacherCount = 0;

              // 遍历选中的用户ID
              for (const userId of userIds) {
                const user = userList.find((u) => u.id === userId);
                if (!user || !user.roleInfo) {
                  continue;
                }

                // 检查用户的角色
                const hasPsychologyTeacher = user.roleInfo.some(
                  (role) => role.roleCode === 'psychology_teacher',
                );
                const hasTeacher = user.roleInfo.some(
                  (role) => role.roleCode === 'teacher',
                );

                if (hasPsychologyTeacher) {
                  psychologyTeacherCount++;
                }
                if (hasTeacher) {
                  teacherCount++;
                }
              }

              // 验证：心理老师和普通老师都不能超过1个
              if (psychologyTeacherCount > 1) {
                return false;
              }
              if (teacherCount > 1) {
                return false;
              }

              return true;
            } catch {
              return true; // 如果API调用失败，不阻止提交
            }
          },
          {
            message: '一个部门只能有一个心理老师和一个普通老师',
          },
        ),
    },
    // {
    //   fieldName: 'phone',
    //   label: '联系电话',
    //   component: 'Input',
    //   componentProps: {
    //     maxLength: 11,
    //     placeholder: '请输入联系电话',
    //   },
    //   rules: 'mobileRequired',
    // },
    // {
    //   fieldName: 'email',
    //   label: '邮箱',
    //   component: 'Input',
    //   componentProps: {
    //     placeholder: '请输入邮箱',
    //   },
    //   rules: z.string().email('请输入正确的邮箱地址').optional(),
    // },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<SystemDeptApi.Dept>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'name',
      title: '部门名称',
      align: 'left',
      fixed: 'left',
      treeNode: true,
    },
    {
      field: 'leaderUserIds',
      title: '负责人',
      slots: {
        default: 'leaderUserIds',
      },
    },
    {
      field: 'sort',
      title: '显示顺序',
    },
    {
      field: 'status',
      title: '部门状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
