<script lang="ts" setup>
defineProps<{ tip: string }>();
</script>

<template>
  <div
    class="relative flex-1 overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 shadow"
  >
    <!-- 背景点缀 -->
    <div
      class="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-orange-200/60 to-amber-100/40 blur-xl"
    ></div>
    <div
      class="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-gradient-to-tr from-amber-200/50 to-orange-100/40 blur-xl"
    ></div>

    <div class="relative p-4 lg:p-6">
      <!-- 标题行 -->
      <div class="flex items-center text-base lg:text-lg">
        <div
          class="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg"
        >
          💡
        </div>
        <span
          class="bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text font-bold text-transparent"
          >心旅小贴士</span>
        <span
          class="ml-3 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700 lg:text-xs"
          >今日更新</span>
      </div>

      <!-- 分隔线 -->
      <div
        class="my-3 h-px w-full bg-gradient-to-r from-transparent via-amber-200 to-transparent lg:my-4"
      ></div>

      <!-- 内容区 -->
      <div
        class="relative rounded-2xl bg-white/60 p-3 shadow-sm ring-1 ring-amber-100 backdrop-blur-sm"
      >
        <div
          class="absolute -left-1 top-3 h-5 w-1 rounded-full bg-amber-400"
        ></div>
        <p
          class="pl-3 text-[13px] leading-relaxed text-amber-900/90 lg:text-sm"
        >
          {{ tip }}
        </p>
      </div>

      <!-- 信息条 -->
      <div
        class="mt-3 flex flex-wrap gap-2 text-[11px] text-amber-700 lg:mt-4 lg:text-xs"
      >
        <span class="rounded-md bg-amber-100/80 px-2 py-0.5">建议时长：2-3 分钟</span>
        <span class="rounded-md bg-amber-100/80 px-2 py-0.5">适用场景：紧张/焦虑/睡前</span>
      </div>

      <!-- 练习步骤 -->
      <div
        class="mt-3 grid gap-2 rounded-2xl bg-white/50 p-3 ring-1 ring-amber-100 lg:mt-4"
      >
        <div class="flex items-start gap-2">
          <span
            class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800"
            >1</span>
          <p class="text-[13px] leading-relaxed text-amber-900/90 lg:text-sm">
            坐直或自然站立，放松肩颈，轻轻合上嘴唇。
          </p>
        </div>
        <div class="flex items-start gap-2">
          <span
            class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800"
            >2</span>
          <p class="text-[13px] leading-relaxed text-amber-900/90 lg:text-sm">
            通过鼻子吸气 4 秒，停留 2 秒，再缓慢呼气 6 秒，重复 5 次。
          </p>
        </div>
        <div class="flex items-start gap-2">
          <span
            class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800"
            >3</span>
          <p class="text-[13px] leading-relaxed text-amber-900/90 lg:text-sm">
            在心里对自己说：我看见我的情绪，并温柔地对待它。
          </p>
        </div>
      </div>

      <!-- 引言 -->
      <div
        class="mt-3 rounded-xl bg-amber-50 p-3 text-[12px] italic text-amber-800 ring-1 ring-amber-100 lg:text-xs"
      >
        “情绪像云朵，来时允许它来，去时也允许它去。”
      </div>

      <!-- 关键词/标签 -->
      <div class="mt-3 flex flex-wrap gap-2 text-[11px] lg:mt-4 lg:text-xs">
        <span
          class="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-amber-700"
        >
          正念
        </span>
        <span
          class="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-amber-700"
        >
          呼吸
        </span>
        <span
          class="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-amber-700"
        >
          放松
        </span>
      </div>

      <!-- 操作区（占位） -->
      <!-- <div class="mt-3 flex flex-wrap gap-2 lg:mt-4">
        <button
          class="rounded-full bg-amber-500 px-3 py-1.5 text-xs text-white shadow hover:bg-amber-600 lg:text-sm"
        >
          开始 1 分钟练习
        </button>
        <button
          class="rounded-full border border-amber-200 bg-white/70 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 lg:text-sm"
        >
          更多练习
        </button>
      </div> -->
    </div>
  </div>
</template>
