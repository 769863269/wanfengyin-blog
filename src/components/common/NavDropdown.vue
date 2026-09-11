<script setup lang="ts">
/**
 * 顶栏多级下拉菜单（递归组件）
 *
 * 桌面端（有 hover 能力）滑过父项即展开面板，移出整块约 160ms 后收起——
 * 延时是为了跨过按钮与面板之间的 6px 间隙时不闪断。
 * 触屏端（hover: none）没有滑动事件，退化为点击切换。
 * 面板内叶子走 NavLink，分支递归自身（二级以上向右侧弹出）。
 * 展开/收起状态集中在 useNavMenu 单例，全站同时只展开一个节点。
 */
import { computed } from 'vue'
import NavLink from '@/components/common/NavLink.vue'
import type { NavItem } from '@/types'
import { useNavMenu } from '@/composables/useNavMenu'

interface Props {
  item: NavItem
  /** 0 = 顶栏一级（面板向下弹），≥1 = 面板内分支（向右弹出） */
  depth?: number
}

const { item, depth = 0 } = defineProps<Props>()

const { openId, open, toggle, close } = useNavMenu()
const isOpen = computed(() => openId.value === item.id)

/**
 * 是否具备 hover 能力：hover: none 的触屏设备走点击切换。
 * matchMedia 需能力探测——jsdom 等测试环境不实现该方法，直接判空兜底。
 */
const canHover =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover)').matches

/** 延时收起计时器：滑入时取消，滑出后延迟执行 */
let closeTimer: ReturnType<typeof setTimeout> | undefined
const CLOSE_DELAY = 160

function onEnter() {
  if (!canHover) return
  clearTimeout(closeTimer)
  open(item.id)
}

function onLeave() {
  if (!canHover) return
  clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    if (openId.value === item.id) close()
  }, CLOSE_DELAY)
}

function onToggle(event: Event) {
  // 阻止冒泡：避免触发 AppHeader 的「点外部收起」监听把刚展开的面板立刻关掉
  event.stopPropagation()
  clearTimeout(closeTimer)
  toggle(item.id)
}
</script>

<template>
  <div class="nav-dd" :class="{ 'nav-dd--open': isOpen }" @click.stop @mouseenter="onEnter" @mouseleave="onLeave">
    <button
      class="nav-dd__toggle"
      type="button"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      @click="onToggle"
    >
      <span v-if="item.icon" class="nav-dd__icon" aria-hidden="true">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
      <span class="nav-dd__caret" aria-hidden="true">▾</span>
    </button>

    <div v-show="isOpen" class="nav-dd__panel" :class="{ 'nav-dd__panel--sub': depth > 0 }">
      <template v-for="child in item.children" :key="child.id">
        <NavDropdown v-if="child.children?.length" :item="child" :depth="depth + 1" />
        <NavLink v-else :item="child" class="nav-dd__link" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.nav-dd {
  position: relative;
}

.nav-dd__toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 15px;
  color: var(--text-primary);
  cursor: pointer;
  transition:
    color var(--duration-base) var(--ease-standard),
    background-color var(--duration-base) var(--ease-standard);
}

.nav-dd__toggle:hover,
.nav-dd--open .nav-dd__toggle {
  color: var(--brand);
  background: var(--brand-soft);
}

.nav-dd__icon {
  font-size: 1em;
  line-height: 1;
}

.nav-dd__caret {
  font-size: 10px;
  line-height: 1;
  opacity: 0.55;
  transition: transform var(--duration-fast) var(--ease-standard);
}

.nav-dd--open .nav-dd__caret {
  transform: rotate(180deg);
}

.nav-dd__panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: calc(var(--z-header) + 10);
  min-width: 190px;
  max-height: min(70vh, 480px);
  overflow-y: auto;
  padding: 6px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 10px 34px rgb(0 0 0 / 14%);
  /* 出现动画：轻位移 + 淡入，跟全站动效口径一致 */
  animation: nav-dd-in var(--duration-fast) var(--ease-standard);
}

/* 二级及更深：在父面板右侧弹出，不做同位堆叠 */
.nav-dd__panel--sub {
  top: -6px;
  left: calc(100% + 4px);
}

@keyframes nav-dd-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.nav-dd__link {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 14px;
  white-space: nowrap;
}

.nav-dd__link:hover {
  color: var(--brand);
  background: var(--bg-subtle);
}

.nav-dd :deep(.nav-link--disabled) {
  cursor: not-allowed;
  opacity: 0.45;
}
</style>
