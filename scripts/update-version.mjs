import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ANSI color codes for better console output
const colors = {
  green: '\u001B[32m',
  red: '\u001B[31m',
  yellow: '\u001B[33m',
  cyan: '\u001B[36m',
  reset: '\u001B[0m',
};

/**
 * 获取北京时间（UTC+8）
 * @returns {string} 格式化的北京时间 YYYY-MM-DD HH:mm
 */
function getBeijingTime() {
  // 获取当前UTC时间的毫秒数
  const now = new Date();
  // 北京时间 = UTC时间 + 8小时
  const beijingOffset = 8 * 60 * 60 * 1000;
  const beijingTime = new Date(now.getTime() + beijingOffset);

  // 格式化时间
  const year = beijingTime.getUTCFullYear();
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getUTCDate()).padStart(2, '0');
  const hours = String(beijingTime.getUTCHours()).padStart(2, '0');
  const minutes = String(beijingTime.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 更新 version.json 文件中的构建时间
 */
function updateVersionFile() {
  const versionPath = path.resolve(__dirname, '../version.json');

  try {
    // 检查文件是否存在
    if (!fs.existsSync(versionPath)) {
      throw new Error(`File not found: ${versionPath}`);
    }

    // 读取当前 version.json 文件内容
    const fileContent = fs.readFileSync(versionPath, 'utf8');
    let versionData;

    try {
      versionData = JSON.parse(fileContent);
    } catch (parseError) {
      throw new Error(`Failed to parse JSON: ${parseError.message}`);
    }

    // 获取并更新构建时间
    const oldBuildTime = versionData.buildTime;
    const newBuildTime = getBeijingTime();
    versionData.buildTime = newBuildTime;

    // 将更新后的内容写回文件
    const updatedContent = `${JSON.stringify(versionData, null, 2)}\n`;
    fs.writeFileSync(versionPath, updatedContent, 'utf8');

    // 输出成功信息
    console.log(`${colors.green}✓${colors.reset} Updated version.json`);
    console.log(`  ${colors.cyan}Path:${colors.reset} ${versionPath}`);
    if (oldBuildTime) {
      console.log(
        `  ${colors.yellow}Old buildTime:${colors.reset} ${oldBuildTime}`,
      );
    }
    console.log(
      `  ${colors.green}New buildTime:${colors.reset} ${newBuildTime}`,
    );
  } catch (error) {
    // 输出详细错误信息
    console.error(
      `${colors.red}✗ Failed to update version.json${colors.reset}`,
    );
    console.error(`  ${colors.red}Error:${colors.reset} ${error.message}`);

    if (error.code === 'ENOENT') {
      console.error(
        `  ${colors.yellow}Hint:${colors.reset} Make sure version.json exists in the project root`,
      );
    } else if (error.code === 'EACCES') {
      console.error(
        `  ${colors.yellow}Hint:${colors.reset} Check file permissions for version.json`,
      );
    }

    // 以非零状态码退出
    process.exit(1);
  }
}

// 执行更新操作
updateVersionFile();
