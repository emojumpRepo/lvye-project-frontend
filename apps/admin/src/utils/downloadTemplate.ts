import * as XLSX from 'xlsx';

function downloadTemplate() {
  // 创建工作簿
  const wb = XLSX.utils.book_new();

  // 创建填写说明工作表
  const instructionData = [
    ['字段名称', '格式要求', '是否必填', '说明', '示例'],
    ['学生名字', '不超过20个字符', '是', '学生的真实姓名', '张三'],
    [
      '学号',
      '数字或字母数字组合，不超过20位',
      '是',
      '学生的唯一标识',
      '2024001',
    ],
    ['性别', '男/女', '是', '只能填写"男"或"女"', '男'],
    ['年级', '数字', '是', '学生所在年级（1-12）', '9'],
    ['班级', '不超过10个字符', '是', '学生所在班级', '1班'],
    ['出生日期', 'YYYY-MM-DD', '是', '日期格式必须为年-月-日', '2008-01-01'],
    ['联系电话', '11位数字', '否', '学生或家长的联系电话', '13800138000'],
    [
      '家庭住址',
      '不超过100个字符',
      '否',
      '学生的详细家庭地址',
      '北京市朝阳区XX街道XX号',
    ],
  ];

  const instructionWs = XLSX.utils.aoa_to_sheet(instructionData);

  // 设置列宽
  instructionWs['!cols'] = [
    { wch: 12 }, // 字段名称
    { wch: 25 }, // 格式要求
    { wch: 10 }, // 是否必填
    { wch: 30 }, // 说明
    { wch: 15 }, // 示例
  ];

  // 设置表头样式（加粗）
  const headerRange = XLSX.utils.decode_range(instructionWs['!ref'] || '');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (instructionWs[cellAddress]) {
      instructionWs[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'F0F0F0' } },
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, instructionWs, '填写说明');

  // 创建学生信息工作表
  const studentData = [
    [
      '学生名字*',
      '学号*',
      '性别*',
      '年级*',
      '班级*',
      '出生日期*',
      '联系电话',
      '家庭住址',
    ],
  ];

  const studentWs = XLSX.utils.aoa_to_sheet(studentData);

  // 设置列宽
  studentWs['!cols'] = [
    { wch: 12 }, // 学生名字
    { wch: 12 }, // 学号
    { wch: 8 }, // 性别
    { wch: 8 }, // 年级
    { wch: 10 }, // 班级
    { wch: 12 }, // 出生日期
    { wch: 15 }, // 联系电话
    { wch: 25 }, // 家庭住址
  ];

  // 设置表头样式
  const studentHeaderRange = XLSX.utils.decode_range(studentWs['!ref'] || '');
  for (let col = studentHeaderRange.s.c; col <= studentHeaderRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (studentWs[cellAddress]) {
      studentWs[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E8F4FD' } },
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, studentWs, '学生信息');

  // 生成并下载文件
  const fileName = `学生批量导入模板_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export default downloadTemplate;
