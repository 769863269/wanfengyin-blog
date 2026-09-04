<script setup lang="ts">
/**
 * 统一导航项渲染
 *
 * 把原模板里 27 个 `href="#"` 死链收敛为三种明确语义：
 *   route    → 站内路由
 *   external → 外链（自动带 noopener/noreferrer）
 *   disabled → 功能未上线，渲染成不可点击的占位并提示「即将上线」
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { NavItem } from '@/types'

interface Props {
  item: NavItem
  /** 是否显示图标 */
  withIcon?: boolean
}

const { item, withIcon = true } = defineProps<Props>()

const isRoute = computed(() => item.kind === 'route' && Boolean(item.to))
const isExternal = computed(() => item.kind === 'external' && Boolean(item.href))
const hint = computed(() => `${item.label}（即将上线）`)
</script>

<template>
  <RouterLink v-if="isRoute && item.to" class="nav-link" :to="{ name: item.to }">
    <span v-if="withIcon && item.icon" class="nav-link__icon" aria-hidden="true">
      {{ item.icon }}
    </span>
    <span>{{ item.label }}</span>
  </RouterLink>

  <a
    v-else-if="isExternal && item.href"
    class="nav-link"
    :href="item.href"
    target="_blank"
    rel="noopener noreferrer"
  >
    <span v-if="withIcon && item.icon" class="nav-link__icon" aria-hidden="true">
      {{ item.icon }}
    </span>
    <span>{{ item.label }}</span>
  </a>

  <span v-else class="nav-link nav-link--disabled" role="link" aria-disabled="true" :title="hint">
    <span v-if="withIcon && item.icon" class="nav-link__icon" aria-hidden="true">
      {{ item.icon }}
    </span>
    <span>{{ item.label }}</span>
  </span>
</template>

<style scoped>
.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.nav-link__icon {
  font-size: 1em;
  line-height: 1;
}

.nav-link--disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
</style>
