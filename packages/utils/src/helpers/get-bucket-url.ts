/**
 * 获取存储桶基本URL
 * @returns 存储桶的基本URL地址
 */
export function getBucketUrl(): string {
  return 'https://mindtrip-1305613707.cos.ap-guangzhou.myqcloud.com/static/';
}

/**
 * 获取存储桶完整URL（带文件路径）
 * @param path 文件路径（相对于static目录）
 * @returns 完整的文件URL
 */
export function getBucketFileUrl(path: string): string {
  const baseUrl = getBucketUrl();
  // 移除path开头的斜杠（如果有）
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}${cleanPath}`;
}
