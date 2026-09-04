import type { HotPost, Post, PostNeighbor, RecentComment, TagName } from '@/types'

/**
 * 文章数据源
 *
 * 当前为本地静态数据。后续接后端 / CMS 时，只需替换本文件的导出，
 * 上层组件与组合式函数无需改动。
 *
 * 注意：publishedAt 存 ISO 日期，相对时间（"1天前"）由 formatRelativeTime
 * 在运行时计算 —— 避免硬编码的相对时间随时间推移而失真。
 */

export const posts: readonly Post[] = [
  {
    slug: 'rest-day',
    title: '休息日',
    excerpt:
      '上一次休息还是在上一次，制造业是真TM🐮🐴本来今天的行程规划的还是比较满的，准备先去处理个违章，然后去医院看看牙，再去外面淘个二手电瓶车，傻鸟公司不让把车……',
    cover: 'linear-gradient(135deg,#ff9a9e,#fad0c4)',
    publishedAt: '2026-09-02',
    views: 609,
    commentCount: 12,
    tags: ['生活', '随笔'],
    featured: true,
    body: [
      {
        type: 'paragraph',
        text: '上一次休息还是在上一次，制造业是真TM🐮🐴。本来今天的行程规划得还是比较满的，准备先去处理个违章，然后去医院看看牙，再去外面淘个二手电瓶车。',
      },
      {
        type: 'paragraph',
        text: '傻鸟公司不让把车停楼下，绕了三圈才找个车位，结果违章还没处理成，窗口排队排到怀疑人生。下午索性躺平，点了份外卖，看了半部电影，才发现休息日最舒服的事就是「啥也不干」。',
      },
      { type: 'heading', text: '关于节奏' },
      {
        type: 'paragraph',
        text: '工作久了容易把「忙」当成常态，一旦停下来反而心慌。其实人不是机器，喘口气不是偷懒，是为了下次转得更稳。',
      },
      { type: 'quote', text: '每个人的内心都有一团火，路过的人只能看到烟。' },
      {
        type: 'paragraph',
        text: '明天又是新的一周，希望违章能顺利处理掉，牙也别再疼了。就到这里，碎碎念结束。',
      },
    ],
  },
  {
    slug: 'take-it-slow',
    title: '慢慢来',
    excerpt:
      '来无锡这边工作一个多月了，感觉还不错，除了吃的不太习惯，太甜了，我竟然在食堂吃到了甜的辣椒小炒肉……四川人表示大为震撼。15号发完工资，和预想的……',
    cover: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
    publishedAt: '2026-08-05',
    views: 1600,
    commentCount: 36,
    tags: ['工作', '生活'],
    featured: true,
    body: [
      {
        type: 'paragraph',
        text: '来无锡这边工作一个多月了，感觉还不错，除了吃的不太习惯，太甜了。我竟然在食堂吃到了甜的辣椒小炒肉，四川人表示大为震撼。',
      },
      {
        type: 'paragraph',
        text: '15号发完工资，和预想的差不多，够花但存不下多少。算了下房租水电，剩下的刚够日常。慢慢来吧，反正也不是第一天上班了。',
      },
      { type: 'heading', text: '关于适应' },
      {
        type: 'paragraph',
        text: '新环境最难的不是工作本身，是把生活重新搭起来：哪家的外卖不踩雷，哪个超市打折，几点下班能赶上末班车。这些都是小事，但每件都要花时间。',
      },
      { type: 'quote', text: '慢慢来，比较快。' },
      {
        type: 'paragraph',
        text: '同事都还不错，问什么都愿意讲。这点比上一家强多了。',
      },
    ],
  },
  {
    slug: 'daily-grind',
    title: '牛马生活',
    excerpt:
      '本来说5.6号入职的，HR又给提前到4号了，来加班给我办入职，看的出来确实很缺人了。来这边也上了几天班了，工作强度一般般吧，氛围还不错，就是太久没上班了，节奏还没找回来……',
    cover: '',
    publishedAt: '2026-07-06',
    views: 1900,
    commentCount: 31,
    tags: ['工作', '随笔'],
    body: [
      {
        type: 'paragraph',
        text: '本来说5.6号入职的，HR又给提前到4号了，来加班给我办入职，看得出来确实很缺人了。',
      },
      {
        type: 'paragraph',
        text: '来这边也上了几天班了，工作强度一般般吧，氛围还不错，就是太久没上班了，节奏还没找回来。早上闹钟响了三遍才爬起来，到工位上先发十分钟呆。',
      },
      { type: 'heading', text: '关于节奏' },
      {
        type: 'paragraph',
        text: '以前觉得上班是消耗，现在觉得没班上更消耗。人大概就是这样，有活干的时候嫌累，闲下来又开始慌。',
      },
      { type: 'quote', text: '所谓牛马，就是一边吐槽一边准时打卡。' },
      {
        type: 'paragraph',
        text: '先这么着吧，等发工资再说。',
      },
    ],
  },
  {
    slug: 'cat-neutering',
    title: '给糯米做绝育',
    excerpt:
      '过年的时候就发过一次情，一直在家喵喵叫，本来想带去做绝育的，不过老爸老妈在家，老年人嘛，知道做个绝育花几大百又要喷我了……也不想因为这些事情吵来吵去。',
    cover: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)',
    publishedAt: '2026-07-15',
    views: 1600,
    commentCount: 28,
    tags: ['生活', '家人'],
    featured: true,
    body: [
      {
        type: 'paragraph',
        text: '过年的时候就发过一次情，一直在家喵喵叫，本来想带去做绝育的，不过老爸老妈在家，老年人嘛，知道做个绝育花几大百又要喷我了。',
      },
      {
        type: 'paragraph',
        text: '也不想因为这些事情吵来吵去，就一直拖着。这次趁他们回老家，赶紧带去医院做了。',
      },
      { type: 'heading', text: '术后三天' },
      {
        type: 'paragraph',
        text: '手术很快，二十分钟就出来了。麻药没过的时候走路打晃，看着挺心疼。医生交代要戴头套，防止舔伤口，糯米戴上的第一反应是往后退，撞到墙。',
      },
      { type: 'quote', text: '它大概以为自己得罪了谁。' },
      {
        type: 'paragraph',
        text: '现在恢复得挺好，又开始满屋子跑了。就是偶尔还会用幽怨的眼神看我一眼。',
      },
    ],
  },
  {
    slug: 'melon-eating',
    title: '吃瓜群众上线',
    excerpt:
      '今天工位对面新来了个实习生，听说是个隐藏的吃瓜高手。中午吃饭聊起部门八卦，那叫一个门儿清，比我这老员工都清楚……',
    cover: 'linear-gradient(135deg,#84fab0,#8fd3f4)',
    publishedAt: '2026-06-10',
    views: 980,
    commentCount: 9,
    tags: ['工作', '随笔'],
    body: [
      {
        type: 'paragraph',
        text: '今天工位对面新来了个实习生，听说是个隐藏的吃瓜高手。中午吃饭聊起部门八卦，那叫一个门儿清，比我这老员工都清楚。',
      },
      {
        type: 'paragraph',
        text: '我在这待了俩月，连隔壁组组长叫啥都还没记全，人家三天就把关系网摸透了。',
      },
      { type: 'heading', text: '关于信息差' },
      {
        type: 'paragraph',
        text: '想想也有道理，新人没包袱，谁都敢聊，聊完就记住了。老人反而有自己的圈子，待久了信息就固化了。',
      },
      { type: 'quote', text: '入职三天，胜过老员工半年。' },
    ],
  },
  {
    slug: 'sweet-wuxi',
    title: '无锡的甜',
    excerpt:
      '来无锡一个多月，最不适应的就是甜。红烧肉是甜的，辣椒炒肉是甜的，连番茄炒蛋都要放糖。作为一个四川胃，每天都在和糖作斗争……',
    cover: 'linear-gradient(135deg,#f6d365,#fda085)',
    publishedAt: '2026-06-22',
    views: 1200,
    commentCount: 17,
    tags: ['生活', '工作'],
    body: [
      {
        type: 'paragraph',
        text: '来无锡一个多月，最不适应的就是甜。红烧肉是甜的，辣椒炒肉是甜的，连番茄炒蛋都要放糖。',
      },
      {
        type: 'paragraph',
        text: '作为一个四川胃，每天都在和糖作斗争。食堂阿姨打菜的时候，我盯着那勺糖想说点什么，最后还是没开口。',
      },
      { type: 'heading', text: '关于适应' },
      {
        type: 'paragraph',
        text: '后来学乖了，自己带瓶辣椒酱，什么菜都能救回来一半。同事看我吃法都觉得新奇，说你们四川人是不是离不开辣。',
      },
      { type: 'quote', text: '不是离不开辣，是离不开家乡那口味道。' },
      {
        type: 'paragraph',
        text: '慢慢也习惯了，偶尔觉得甜口也不错。就是回老家大概要被说「口味变了」。',
      },
    ],
  },
  {
    slug: 'about-saving',
    title: '关于攒钱这件事',
    excerpt:
      '发工资第二天就还了花呗和白条，剩下的钱打算强制存一半。以前总觉得钱是赚出来的不是省出来的，现在觉得，先别月光再说吧……',
    cover: '',
    publishedAt: '2026-05-14',
    views: 2100,
    commentCount: 44,
    tags: ['生活', '随笔'],
    body: [
      {
        type: 'paragraph',
        text: '发工资第二天就还了花呗和白条，剩下的钱打算强制存一半。',
      },
      {
        type: 'paragraph',
        text: '以前总觉得钱是赚出来的不是省出来的，现在觉得，先别月光再说吧。',
      },
      { type: 'heading', text: '关于观念' },
      {
        type: 'paragraph',
        text: '工作以后才发现，「能存下钱」本身就是一种能力，跟收入高低不完全挂钩。身边有人工资比我高一半，月底照样只剩两位数。',
      },
      { type: 'quote', text: '存钱不是为了变有钱，是为了有得选。' },
      {
        type: 'paragraph',
        text: '先坚持三个月看看效果。',
      },
    ],
  },
] as const

/**
 * 按发布时间倒序（新 → 旧）。
 * 数据源无需手工维护顺序，避免新增文章时忘记插入位置。
 */
export const sortedPosts: readonly Post[] = [...posts].sort(
  (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
)

/** 轮播展示的精选文章 */
export const featuredPosts: readonly Post[] = sortedPosts.filter((post) => post.featured === true)

/** 侧栏热门文章：按阅读量取前 4 */
export const hotPosts: readonly HotPost[] = [...sortedPosts]
  .sort((a, b) => b.views - a.views)
  .slice(0, 4)
  .map(({ slug, title }) => ({ slug, title }))

/** 侧栏标签云：按出现次数降序去重 */
export const tagCloud: readonly TagName[] = [...new Set(posts.flatMap((post) => post.tags))].sort(
  (a, b) => {
    const countA = posts.filter((post) => post.tags.includes(a)).length
    const countB = posts.filter((post) => post.tags.includes(b)).length
    return countB - countA
  },
)

export const recentComments: readonly RecentComment[] = [
  { id: 'c1', author: '夏末', content: '哈哈哈太真实了，打工人真实写照' },
  { id: 'c2', author: '阿强', content: '无锡的甜确实有点顶不住' },
  { id: 'c3', author: '小米', content: '猫猫绝育恢复得怎么样啦' },
] as const

/** 按 slug 查找文章。返回 undefined 而非抛错，由调用方决定 404 处理。 */
export function findPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug)
}

/** 拼接正文纯文本（阅读时长、摘要派生等场景使用） */
export function postPlainText(post: Post): string {
  return post.body.map((block) => ('text' in block ? block.text : '')).join(' ')
}

/** 取上一篇 / 下一篇（按时间倒序，即「上一篇」是更新的那篇） */
export function getNeighbors(slug: string): {
  prev: PostNeighbor | undefined
  next: PostNeighbor | undefined
} {
  const index = sortedPosts.findIndex((post) => post.slug === slug)
  if (index === -1) return { prev: undefined, next: undefined }

  const newer = sortedPosts[index - 1]
  const older = sortedPosts[index + 1]

  return {
    prev: newer ? { slug: newer.slug, title: newer.title } : undefined,
    next: older ? { slug: older.slug, title: older.title } : undefined,
  }
}
