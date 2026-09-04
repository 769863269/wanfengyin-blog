<script setup lang="ts">
/**
 * 站点 Logo
 *
 * 原始模板用 `onerror="this.outerHTML='晚风吟'"` 直接改 DOM，
 * 属于副作用式 hack。这里改为状态驱动：图片加载失败时降级为文字。
 */
import { ref } from 'vue'
import { siteConfig } from '@/config/site'

interface Props {
  /** 供读屏软件识别；纯装饰场景传空字符串 */
  alt?: string
}

const { alt = siteConfig.name } = defineProps<Props>()

const failed = ref(false)
</script>

<template>
  <img
    v-if="!failed"
    class="site-logo"
    :src="siteConfig.logo"
    :alt="alt"
    decoding="async"
    @error="failed = true"
  />
  <b v-else class="site-logo site-logo--text">{{ siteConfig.name }}</b>
</template>

<style scoped>
.site-logo {
  height: 34px;
  width: auto;
}

.site-logo--text {
  display: inline-flex;
  align-items: center;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}
</style>
