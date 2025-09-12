import dayjs from 'dayjs';

export interface TimeRange {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
}

export function useTimeCalculation() {
  /**
   * 计算时间段的持续时间文本
   */
  const calculateDurationText = (timeRange: TimeRange | undefined) => {
    if (!timeRange?.start || !timeRange?.end) return '';

    try {
      // 确保是有效的 dayjs 对象
      const start = dayjs.isDayjs(timeRange.start)
        ? timeRange.start
        : dayjs(timeRange.start);

      const end = dayjs.isDayjs(timeRange.end)
        ? timeRange.end
        : dayjs(timeRange.end);

      if (!start || !end || !start.isValid() || !end.isValid()) {
        return '';
      }

      const duration = end.diff(start, 'minute');

      if (duration < 60) {
        return `持续时间：${duration}分钟`;
      }
      if (duration % 60 === 0) {
        return `持续时间：${duration / 60}小时`;
      }
      return `持续时间：${Math.floor(duration / 60)}小时${duration % 60}分钟`;
    } catch {
      return '';
    }
  };

  /**
   * 格式化日期显示
   */
  const formatDate = (date: string | undefined) => {
    if (!date) return '未选择';
    return dayjs(date).format('YYYY年MM月DD日');
  };

  /**
   * 检查是否为今天
   */
  const isToday = (date: string | undefined) => {
    if (!date) return false;
    return dayjs(date).isSame(dayjs(), 'day');
  };

  /**
   * 获取禁用时间配置（用于今天的时间选择）
   */
  const getDisabledTimeConfig = (
    selectedDate: dayjs.Dayjs | string | undefined,
  ) => {
    if (!selectedDate) return {};
    const d = dayjs.isDayjs(selectedDate) ? selectedDate : dayjs(selectedDate);
    if (!d.isSame(dayjs(), 'day')) return {};

    const curHour = dayjs().hour();
    const curMinute = dayjs().minute();
    return {
      disabledHours: () => Array.from({ length: curHour }, (_, i) => i),
      disabledMinutes: (selectedHour: number) =>
        selectedHour === curHour
          ? Array.from({ length: curMinute }, (_, i) => i)
          : [],
      disabledSeconds: () => [],
    };
  };

  return {
    calculateDurationText,
    formatDate,
    isToday,
    getDisabledTimeConfig,
  };
}
