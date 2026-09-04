/**
 * 将根路径资源（/images/... 等）拼上部署 base。
 *
 * GitHub Pages 项目页部署在子路径 /wanfengyin-blog/ 下，数据里的封面等
 * 资源路径是根路径写法，运行时若不加 base 前缀，线上会 404。
 * dev 环境 BASE_URL 为 '/'，行为不变；外链 / data URI 原样返回。
 */
export function withBase(path: string): string {
  if (!path || /^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path
  const base = import.meta.env.BASE_URL
  return `${base.endsWith('/') ? base : `${base}/`}${path.replace(/^\//, '')}`
}
