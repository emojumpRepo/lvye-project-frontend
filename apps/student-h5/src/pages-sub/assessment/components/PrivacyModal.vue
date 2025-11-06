<script lang="ts" setup>
import { computed } from 'vue'

interface Props {
  modelValue: boolean
}

defineOptions({
  name: 'PrivacyModal',
})

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

function handleConfirm() {
  emit('confirm')
}
</script>

<template>
  <wd-popup
    v-model="visible" position="center" custom-style="border-radius: 32rpx; width: 70vw; padding: 30rpx;"
    modal-style="background-color: #00000066;"
  >
    <!-- 标题 -->
    <view class="flex flex-col items-center gap-1.5">
      <view class="title-text mt-1 text-base font-semibold">
        MindTrip心之旅
      </view>
      <view class="desc-text text-xs font-medium">
        使用知情同意书
      </view>
    </view>

    <Divider />

    <!-- 内容 -->
    <view class="relative">
      <view class="letter-spacing-0.5 max-h-[45vh] flex flex-col gap-4 overflow-y-auto tracking-wider">
        <view>
          <view class="content-title">
            一、关于测评：
          </view>
          <view class="content-text">
            作为本次心理测试的受测者，我已经获知本次测试是学校组织实施的大学生心理健康测评。此次测试的内容包括但不仅限于一般心理状况、躯体化症状、过往经历、生活作息等模块，测试的目的是评估我的精神心理健康状况，以便帮助我了解自身的精神心理状态，实现心理健康发展。
          </view>
        </view>

        <view>
          <view class="content-title">
            二、关于测评工具：
          </view>
          <view class="content-text">
            我获知，本测评系统由受测试者自己评定，以及真实地回答每个项目事关测试结果的实际价值。
          </view>
        </view>

        <view>
          <view class="content-title">
            三、关于结果解释：
          </view>
          <view class="content-text">
            我获知，测评结束后，我将有权从学校心理健康教育机构获得我个人的测试结果和对结果的解释；我将获得相应的建议和帮助。
          </view>
        </view>

        <view>
          <view class="content-title">
            四、关于保密原则隐私保护：
          </view>
          <view class="content-text pb-6">
            我获知:<br>
            <ul class="list-disc list-inside p-0">
              <li>测评工具开发团队和学校会通过测评结果获取我的个人信息、家庭信息等隐私信息，仅为了解我的心理健康状况所用，不可用作任何商业用途；</li>
              <li>学校将对我的测试结果归档至心理健康档案，同时对我的信息进行严格保密，除我之外，只有学校心理健康教育专业教师可以在需要为我提供心理健康服务时接触和使用，第三人没有权限查阅心理档案；</li>
              <li>如遇特殊情况，由学校心理健康教育专业教师评估后，需家属或其他专业人员参与干预，则可将我的测评结果重点告知家属及其他专业人员；</li>
              <li>测评结果不会影响我的学籍、入党、奖励、升学和就业等。</li>
            </ul>
          </view>
        </view>
      </view>

      <!-- 渐变遮罩 -->
      <view
        class="pointer-events-none absolute bottom-0 left-0 right-0 h-8.5"
        style="background: linear-gradient(to bottom, transparent, white);"
      />
    </view>

    <!-- 按钮 -->
    <LyButton type="primary" size="large" block @click="handleConfirm">
      已阅读并同意
    </LyButton>
  </wd-popup>
</template>

<style lang="scss" scoped>
.content-title {
  @apply text-sm text-[var(--title-text-color)] font-medium mb-1;
}

.content-text {
  @apply text-xs text-[var(--desc-text-color-heavy)] leading-5;
}
</style>
