<script lang="ts" setup>
import { useRouter } from 'vue-router';

interface AssessmentItem {
  id: string;
  title: string;
  description: string;
  gradient: string;
  iconImage: string;
  iconImageSize?: number;
  /** 小屏幕专用：图标像素高度（优先级高于比例） */
  iconImageSizeSm?: number;
  /** 小屏幕专用：图标高度占容器高度的比例(0-1)，当未设置 iconImageSizeSm 时生效 */
  iconImageScaleSm?: number;
  /** 小屏幕专用：图标透明度(0-1) */
  iconOpacitySm?: number;
  /** 小屏幕专用：图标水平偏移(px)，相对居中位置 */
  imgOffsetXSm?: number;
  /** 小屏幕专用：图标垂直偏移(px)，相对顶部位置 */
  imgOffsetYSm?: number;
  imgOffsetX?: number;
  imgOffsetY?: number;
  /** 跳转链接 */
  link: string;
}

defineProps<{ items: AssessmentItem[] }>();

const router = useRouter();

const handleClick = (link: string) => {
  if (link) {
    router.push(link);
  }
};
</script>

<template>
  <div
    class="flex h-full min-h-0 flex-col rounded-3xl border-0 bg-white/60 p-4 shadow backdrop-blur-sm"
  >
    <div class="mb-3 flex items-center text-xl font-bold text-emerald-900">
      <span
        class="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent"
      >
        测评快速入口
      </span>
      <span
        class="ml-2 h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-emerald-600 to-teal-600"
      ></span>
    </div>
    <div
      class="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-1 lg:gap-4"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="group relative overflow-hidden rounded-2xl border border-emerald-100/60 bg-gray-50 shadow transition-all duration-300 hover:shadow-xl md:hover:-translate-y-1"
      >
        <!-- 小屏幕：垂直布局 -->
        <div
          class="relative flex h-full min-h-[160px] flex-col p-3 text-center lg:hidden"
        >
          <!-- 文案内容：置于上层 -->
          <div class="relative z-10 flex flex-1 flex-col">
            <div class="mb-0.5 text-left text-lg font-bold text-emerald-900">
              {{ item.title }}
            </div>
            <div
              class="line-clamp-3 text-left text-sm leading-relaxed text-emerald-900/80"
            >
              {{ item.description }}
            </div>
            <span
              class="mt-auto inline-block rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 active:scale-[0.99]"
            >
              开始测评
            </span>
          </div>

          <!-- 背景图标：绝对定位+比例尺寸 -->
          <img
            :src="item.iconImage"
            alt="assessment"
            class="pointer-events-none absolute right-0 top-0 object-contain drop-shadow-sm"
            :style="{
              height: item.iconImageSizeSm
                ? `${item.iconImageSizeSm}px`
                : `${Math.round((item.iconImageScaleSm ?? 0.45) * 100)}%`,
              width: 'auto',
              opacity: item.iconOpacitySm ?? 0.25,
              marginLeft: `${item.imgOffsetXSm || 0}px`,
              marginTop: `${item.imgOffsetYSm || 0}px`,
              zIndex: 0,
            }"
          />
        </div>

        <!-- 大屏幕：左右布局 -->
        <div class="hidden h-full lg:flex lg:min-h-[140px]">
          <!-- 左侧内容 -->
          <div class="flex flex-1 flex-col justify-center p-8 text-emerald-900">
            <h3 class="mb-2 text-2xl font-bold leading-tight">
              {{ item.title }}
            </h3>
            <p class="mb-6 text-base leading-relaxed text-emerald-900/80">
              {{ item.description }}
            </p>
            <button
              class="inline-flex w-fit items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow transition-all duration-200 hover:bg-emerald-700 hover:shadow-md"
              @click="handleClick(item.link)"
            >
              开 始 测 评
            </button>
          </div>

          <!-- 右侧图片区域 -->
          <div class="relative w-44">
            <img
              :src="item.iconImage"
              alt="assessment"
              class="absolute right-3 top-1/2 -translate-y-1/2 object-contain drop-shadow-sm transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110"
              :style="{
                height: `${item.iconImageSize ?? 96}px`,
                width: 'auto',
                marginRight: `${item.imgOffsetX || 0}px`,
                marginTop: `${item.imgOffsetY || 0}px`,
              }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
