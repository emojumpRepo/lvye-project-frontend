<script lang="ts" setup>
interface Props {
  content: string
}

defineOptions({
  name: 'CommentItem',
})

defineProps<Props>()

/**
 * 清理和修复 HTML 内容
 */
function cleanHtml(html: string): string {
  if (!html)
    return ''

  let cleaned = html
    // 移除转义的引号
    .replace(/\\"/g, '"')
    // 确保段落标签完整
    .trim()

  // 如果内容以 </p> 结尾但没有开始标签，添加开始标签
  if (cleaned.startsWith('<span') && cleaned.includes('</p>')) {
    cleaned = `<p>${cleaned}`
  }

  // 替换 \n 为真实换行
  cleaned = cleaned.replace(/\\n/g, '')

  // 简化 h4 标签内的嵌套结构（移除多余的样式属性，保留内容）
  // 例如: <h4><span style="..."><span style="...">文本</span></span></h4>
  // 将被处理为更简洁的形式
  cleaned = cleaned.replace(
    /<h4>(<span[^>]*>)+([^<]+)(<\/span>)+<\/h4>/g,
    '<h4>$2</h4>',
  )

  return cleaned
}
</script>

<template>
  <view class="comment-item">
    <!-- Rich text content -->
    <view class="rounded-xl bg-#F7FBFAFF p-30rpx">
      <rich-text :nodes="cleanHtml(content)" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.comment-item {
  :deep(uni-rich-text) {
    line-height: 44rpx;
    overflow-wrap: break-word;

    h4 {
      display: block;
      margin-bottom: 16rpx;
      font-size: 28rpx !important;
      font-weight: 500;
      line-height: 50rpx;
      overflow-wrap: break-word;

      &:first-child {
        margin-top: 0;
      }

      // 强制 h4 内的所有元素继承 h4 的样式
      span,
      strong {
        font-size: inherit !important;
        line-height: inherit !important;
      }
    }

    p {
      display: block;
      margin-bottom: 16rpx;
      font-size: 28rpx;
      line-height: 44rpx;
      overflow-wrap: break-word;

      &:last-child {
        margin-bottom: 0;
      }
    }

    span {
      display: inline;
      line-height: inherit;
      overflow-wrap: break-word;
    }

    strong {
      display: inline;
      overflow-wrap: break-word;
    }
  }
}
</style>
