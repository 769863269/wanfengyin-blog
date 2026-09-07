/**
 * 晚风吟 Studio CMS 入口
 *
 * 用法：npm run studio → 浏览器打开 http://127.0.0.1:5199/
 *
 * 结构（scripts/studio/）：
 *   store.mjs   数据层：articles/*.md 读写、状态机、回收站、日志、权限、调度
 *   server.mjs  服务层：路由、发布同步任务、定时调度器
 *   page.mjs    管理界面（单页，Tailwind 浏览器构建本地伺服）
 *
 * 仅监听 127.0.0.1，运行时零外部依赖。
 */
import { startStudio } from './studio/server.mjs'

startStudio(5199)
