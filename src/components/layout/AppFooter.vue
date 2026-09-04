<script setup lang="ts">
/**
 * 页脚
 *
 * 原版把社交图标的 SVG 内联在每个页面里复制两份，
 * 这里统一由 socialLinks 配置驱动，改一处即可。
 */
import { RouterLink } from 'vue-router'
import BaseIcon from '@/components/common/BaseIcon.vue'
import NavLink from '@/components/common/NavLink.vue'
import SiteLogo from '@/components/common/SiteLogo.vue'
import { footerFriendLinks, footerQuickLinks, siteConfig, socialLinks } from '@/config/site'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <!-- 品牌区 -->
      <div class="app-footer__col app-footer__brand">
        <RouterLink class="app-footer__logo" :to="{ name: 'home' }">
          <SiteLogo />
        </RouterLink>

        <p class="app-footer__desc">
          {{ siteConfig.tagline }}
          <br />
          记录开发、生活与一点点技术碎碎念。
        </p>

        <div class="app-footer__social">
          <a
            v-for="link in socialLinks"
            :key="link.id"
            :href="link.href"
            :aria-label="link.label"
            :title="link.label"
            target="_blank"
            rel="noopener noreferrer"
          >
            <BaseIcon :path="link.iconPath" />
          </a>
        </div>
      </div>

      <!-- 快速链接 -->
      <div class="app-footer__col">
        <h4>快速链接</h4>
        <ul>
          <li v-for="item in footerQuickLinks" :key="item.id">
            <NavLink :item="item" :with-icon="false" />
          </li>
        </ul>
      </div>

      <!-- 友情链接 -->
      <div class="app-footer__col">
        <h4>友情链接</h4>
        <ul>
          <li v-for="item in footerFriendLinks" :key="item.id">
            <NavLink :item="item" :with-icon="false" />
          </li>
        </ul>
      </div>
    </div>

    <div class="app-footer__bottom">
      <span>© {{ siteConfig.since }}-{{ currentYear }} {{ siteConfig.name }} 保留所有权利</span>
      <span class="app-footer__sep" aria-hidden="true">·</span>
      <a :href="siteConfig.icpUrl" target="_blank" rel="noopener noreferrer">
        {{ siteConfig.icp }}
      </a>
      <span class="app-footer__powered">Theme by {{ siteConfig.name }}</span>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  max-width: var(--container-max);
  margin: 52px auto 0;
  padding: 0 16px 36px;
  color: var(--text-secondary);
  font-size: 13px;
}

.app-footer::before {
  content: '';
  display: block;
  height: 1px;
  margin-bottom: 42px;
  background: linear-gradient(
    to right,
    transparent,
    var(--border) 12%,
    var(--border) 88%,
    transparent
  );
}

.app-footer__inner {
  display: grid;
  grid-template-columns: 1.8fr 1fr 1fr;
  gap: 36px 56px;
  align-items: start;
}

.app-footer__brand {
  max-width: 340px;
}

.app-footer__logo {
  display: inline-flex;
  align-items: center;
}

.app-footer__logo :deep(.site-logo) {
  height: 36px;
}

.app-footer__desc {
  margin: 16px 0 20px;
  line-height: 1.9;
  font-size: 13px;
}

.app-footer__social {
  display: flex;
  gap: 12px;
}

.app-footer__social a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 17px;
  border: 1px solid var(--border);
  border-radius: var(--radius-round);
  transition: all var(--duration-base) var(--ease-standard);
}

.app-footer__social a:hover {
  color: var(--brand-contrast);
  background: var(--brand);
  border-color: var(--brand);
  transform: translateY(-2px);
}

.app-footer__col h4 {
  position: relative;
  margin-bottom: 16px;
  padding-left: 12px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}

.app-footer__col h4::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 13px;
  border-radius: 2px;
  background: var(--brand);
}

.app-footer__col :deep(.nav-link) {
  font-size: 13px;
  transition: all var(--duration-fast) var(--ease-standard);
}

.app-footer__col :deep(.nav-link:not(.nav-link--disabled):hover) {
  color: var(--brand);
  transform: translateX(3px);
}

.app-footer__col li {
  margin-bottom: 11px;
}

.app-footer__bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 42px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-muted);
}

.app-footer__bottom a {
  color: var(--text-muted);
  transition: color var(--duration-fast) var(--ease-standard);
}

.app-footer__bottom a:hover {
  color: var(--brand);
}

.app-footer__sep {
  color: var(--border);
}

.app-footer__powered {
  margin-left: auto;
}

@media (max-width: 992px) {
  .app-footer__inner {
    grid-template-columns: 1fr 1fr;
    gap: 26px 30px;
  }

  .app-footer__brand {
    grid-column: 1 / -1;
    max-width: none;
  }
}

@media (max-width: 768px) {
  /* 移动端只留品牌区 + 版权条，导航入口已在抽屉里，避免页脚冗长 */
  .app-footer {
    margin-top: 24px;
    padding-bottom: 24px;
  }

  .app-footer__inner {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .app-footer__brand {
    grid-column: auto;
    max-width: none;
    text-align: center;
  }

  .app-footer__logo {
    justify-content: center;
  }

  .app-footer__desc {
    margin: 14px auto 18px;
    max-width: 300px;
    line-height: 1.7;
  }

  .app-footer__social {
    justify-content: center;
  }

  .app-footer__col:not(.app-footer__brand) {
    display: none;
  }

  .app-footer__bottom {
    justify-content: center;
    gap: 6px;
    margin-top: 22px;
    padding-top: 16px;
    text-align: center;
    font-size: 11px;
  }

  .app-footer__powered {
    width: 100%;
    margin-left: 0;
    text-align: center;
  }
}

@media (max-width: 600px) {
  .app-footer__desc {
    max-width: 260px;
    font-size: 12px;
  }

  .app-footer__social a {
    width: 30px;
    height: 30px;
    font-size: 15px;
  }
}
</style>
