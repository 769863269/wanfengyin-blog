<script setup lang="ts">
/**
 * 手机抽屉的多级折叠组（递归组件）
 *
 * 父项渲染为「点击展开/收起」的折叠行，本身不再跳转；
 * 叶子走 NavLink，点击后通过注入的 closeDrawer 关掉抽屉。
 * 层级缩进按 depth 递增，保证多级在窄屏上依然可读。
 */
import { inject, ref } from 'vue'
import NavLink from '@/components/common/NavLink.vue'
import type { NavItem } from '@/types'

interface Props {
  item: NavItem
  depth?: number
}

const { item, depth = 0 } = defineProps<Props>()

// MobileDrawer provide 注入；兜底空函数（组件单测等无抽屉环境不炸）
const closeDrawer = inject<() => void>('drawer:close', () => {})

const open = ref(false)

/** 每级固定缩进，与抽屉行的 22px 内边距对齐 */
const indentStyle = { paddingLeft: `calc(22px + ${depth} * 18px)` }
</script>

<template>
  <div class="dgroup">
    <button
      class="dgroup__toggle"
      type="button"
      :style="indentStyle"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span v-if="item.icon" class="dgroup__icon" aria-hidden="true">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
      <span class="dgroup__caret" :class="{ 'dgroup__caret--open': open }" aria-hidden="true">▸</span>
    </button>

    <div v-show="open" class="dgroup__list">
      <template v-for="child in item.children" :key="child.id">
        <DrawerGroup v-if="child.children?.length" :item="child" :depth="depth + 1" />
        <NavLink v-else :item="child" class="dgroup__link" :style="{ paddingLeft: `calc(22px + ${depth + 1} * 18px)` }" @click="closeDrawer" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.dgroup__toggle {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  padding: 15px 22px;
  padding-right: 22px;
  font-size: 16px;
  color: var(--text-primary);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
  transition: color var(--duration-base) var(--ease-standard);
}

.dgroup__toggle:active {
  color: var(--brand);
  background: var(--bg-subtle);
}

.dgroup__icon {
  font-size: 1em;
  line-height: 1;
}

.dgroup__caret {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.5;
  transition: transform var(--duration-fast) var(--ease-standard);
}

.dgroup__caret--open {
  transform: rotate(90deg);
}

.dgroup__list {
  background: var(--bg-subtle);
}

/* 折叠内的行沿用抽屉行高（15px/16px），只覆盖背景：浅一档区分层级 */
.dgroup__link {
  background: var(--bg-subtle);
}

.dgroup__list :deep(.nav-link) {
  border-bottom: 1px solid var(--border-subtle);
}
</style>
