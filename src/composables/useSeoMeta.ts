import { watchEffect, type MaybeRefOrGetter, toValue } from 'vue'

/**
 * 动态 SEO 元信息
 *
 * SPA 的 index.html 只有一份静态 meta，路由切换后搜索引擎和分享卡片
 * 拿到的仍是首屏信息。这里在路由变化时同步更新 title / description / og:*。
 */

interface SeoOptions {
  title: MaybeRefOrGetter<string>
  description?: MaybeRefOrGetter<string>
  /** og:type，默认 website */
  type?: MaybeRefOrGetter<string>
  /** 规范链接 */
  url?: MaybeRefOrGetter<string>
  image?: MaybeRefOrGetter<string | undefined>
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function upsertLink(rel: string, href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

function removeMeta(attr: 'name' | 'property', key: string): void {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove()
}

function removeLink(rel: string): void {
  document.head.querySelector(`link[rel="${rel}"]`)?.remove()
}

export function useSeoMeta(options: SeoOptions): void {
  watchEffect(() => {
    const title = toValue(options.title)
    const description = toValue(options.description) ?? ''
    const type = toValue(options.type) ?? 'website'
    const url = toValue(options.url)
    const image = toValue(options.image)

    if (title) document.title = title
    if (description) upsertMeta('name', 'description', description)

    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:type', type)
    if (description) upsertMeta('property', 'og:description', description)

    // 规范链接必须随路由清理：文章页设置的 canonical 若残留到首页，
    // 搜索引擎会把首页判定为重复内容
    if (url) {
      upsertMeta('property', 'og:url', url)
      upsertLink('canonical', url)
    } else {
      removeMeta('property', 'og:url')
      removeLink('canonical')
    }

    // 分享图与规范链接同理：无图页面要清掉上一页残留的 og:image
    if (image) {
      upsertMeta('property', 'og:image', image)
    } else {
      removeMeta('property', 'og:image')
    }
  })
}
