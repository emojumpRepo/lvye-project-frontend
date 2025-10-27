export interface FormatQuestionIndexOptions {
  maxItems?: number;
}

export interface FormattedQuestionIndexResult {
  text: string;
  fullText: string;
  list: number[];
}

function toNumberArray(input: string | string[]): number[] {
  const arr = Array.isArray(input) ? input : input ? input.split(',') : [];
  return arr
    .map((s) => Number(String(s).trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function compressRanges(sortedNums: number[]): string[] {
  if (sortedNums.length === 0) return [];
  const ranges: string[] = [];
  let start = sortedNums[0];
  let prev = sortedNums[0];

  for (let i = 1; i < sortedNums.length; i++) {
    const cur = sortedNums[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    if (start === prev) {
      ranges.push(`第${start}题`);
    } else {
      ranges.push(`第${start}~${prev}题`);
    }
    start = prev = cur;
  }
  if (start === prev) {
    ranges.push(`第${start}题`);
  } else {
    ranges.push(`第${start}~${prev}题`);
  }
  return ranges;
}

export function formatQuestionIndex(
  input: string | string[] | undefined,
  options: FormatQuestionIndexOptions = {},
): FormattedQuestionIndexResult {
  const { maxItems = 8 } = options;

  if (!input || (Array.isArray(input) && input.length === 0)) {
    return { text: '无', fullText: '无', list: [] };
  }

  if (input === 'all') {
    return { text: '全部题目', fullText: '全部题目', list: [] };
  }

  const nums = [...new Set(toNumberArray(input))].sort((a, b) => a - b);
  if (nums.length === 0) {
    return { text: '无', fullText: '无', list: [] };
  }

  const parts = compressRanges(nums);
  const full = parts.join('、');

  if (parts.length <= maxItems) {
    return { text: full, fullText: full, list: nums };
  }

  const brief = `${parts.slice(0, maxItems).join('、')} 等${nums.length}题`;
  return { text: brief, fullText: full, list: nums };
}
