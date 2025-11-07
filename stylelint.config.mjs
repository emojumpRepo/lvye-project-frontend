export default {
  extends: ['@vben/stylelint-config'],
  root: true,
  rules: {
    // Allow rpx units for uni-app
    'unit-no-unknown': [
      true,
      {
        ignoreUnits: ['rpx'],
      },
    ],
    'declaration-property-value-no-unknown': null,
  },
};
