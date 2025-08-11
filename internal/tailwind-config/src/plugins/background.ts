import plugin from 'tailwindcss/plugin';

/**
 * 自定义背景插件 - 生成使用 background 属性而不是 background-color 的类
 */
export const backgroundPlugin = plugin(({ addUtilities, theme }) => {
  const colors = theme('colors') || {};
  const utilities: Record<string, any> = {};

  // 为特定的颜色生成 background 属性的工具类
  const specialColors = ['header', 'sidebar', 'main'];

  specialColors.forEach((colorName) => {
    if (colors[colorName]) {
      const colorValue = colors[colorName];

      if (typeof colorValue === 'string') {
        // 单一颜色值
        utilities[`.bg-${colorName}`] = {
          background: colorValue,
        };
      } else if (typeof colorValue === 'object') {
        // 颜色对象（包含 DEFAULT 和其他变体）
        if (colorValue.DEFAULT) {
          utilities[`.bg-${colorName}`] = {
            background: colorValue.DEFAULT,
          };
        }

        // 为颜色变体生成类
        Object.entries(colorValue).forEach(([variant, value]) => {
          if (variant !== 'DEFAULT' && typeof value === 'string') {
            utilities[`.bg-${colorName}-${variant}`] = {
              background: value,
            };
          }
        });
      }
    }
  });

  addUtilities(utilities);
});
