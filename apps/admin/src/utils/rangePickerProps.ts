import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';

import { $t } from '#/locales';

/** 时间段选择器拓展  */
export function getRangePickerDefaultProps() {
  return {
    format: 'YYYY-MM-DD HH:mm:ss',
    placeholder: [
      $t('utils.rangePicker.beginTime'),
      $t('utils.rangePicker.endTime'),
    ],
    presets: [
      {
        label: $t('utils.rangePicker.today'),
        value: () =>
          [dayjs().startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs],
      },
      {
        label: $t('utils.rangePicker.last7Days'),
        value: () =>
          [dayjs().subtract(7, 'day').startOf('day'), dayjs().endOf('day')] as [
            Dayjs,
            Dayjs,
          ],
      },
      {
        label: $t('utils.rangePicker.last30Days'),
        value: () =>
          [
            dayjs().subtract(30, 'day').startOf('day'),
            dayjs().endOf('day'),
          ] as [Dayjs, Dayjs],
      },
      {
        label: $t('utils.rangePicker.yesterday'),
        value: () =>
          [
            dayjs().subtract(1, 'day').startOf('day'),
            dayjs().subtract(1, 'day').endOf('day'),
          ] as [Dayjs, Dayjs],
      },
      {
        label: $t('utils.rangePicker.thisWeek'),
        value: () =>
          [dayjs().startOf('week'), dayjs().endOf('day')] as [Dayjs, Dayjs],
      },
      {
        label: $t('utils.rangePicker.thisMonth'),
        value: () =>
          [dayjs().startOf('month'), dayjs().endOf('day')] as [Dayjs, Dayjs],
      },
      {
        label: $t('utils.rangePicker.lastWeek'),
        value: () =>
          [
            dayjs().subtract(1, 'week').startOf('day'),
            dayjs().endOf('day'),
          ] as [Dayjs, Dayjs],
      },
    ],
    showTime: {
      defaultValue: [
        dayjs('00:00:00', 'HH:mm:ss'),
        dayjs('23:59:59', 'HH:mm:ss'),
      ],
      format: 'HH:mm:ss',
    },
    transformDateFunc: (dates: any) => {
      if (dates && dates.length === 2) {
        // 格式化为后台支持的时间格式
        return [dates.createTime[0], dates.createTime[1]].join(',');
      }
      return {};
    },
    valueFormat: 'YYYY-MM-DD HH:mm:ss',
  };
}
