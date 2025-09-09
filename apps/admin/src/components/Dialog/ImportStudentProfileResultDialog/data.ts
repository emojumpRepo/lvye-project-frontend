export const studentBulkImportColumns = [
  {
    title: '学号',
    dataIndex: 'studentNo',
    minWidth: 100,
  },

  {
    title: '姓名',
    dataIndex: 'name',
    minWidth: 100,
  },
  {
    title: '出生日期',
    dataIndex: 'birthDate',
    minWidth: 120,
  },
  {
    title: '性别',
    dataIndex: 'sex',
    minWidth: 100,
  },
  {
    title: '班级',
    dataIndex: 'className',
    minWidth: 100,
  },
];

export const studentBulkImportFailedDataColumns = [
  {
    title: '学号',
    dataIndex: 'studentNo',
    minWidth: 100,
  },

  {
    title: '姓名',
    dataIndex: 'name',
    minWidth: 100,
  },
  {
    title: '班级',
    dataIndex: 'className',
    minWidth: 100,
  },
  {
    title: '错误信息',
    dataIndex: 'errorMessage',
  },
];
