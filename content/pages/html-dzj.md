---
title: 打字机HTML
description: 好看简约的打字机特效效果页面
status: published
fullHtml: true
---

<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>丝滑打字机效果</title>
<style>
*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}
body{
  background:#121212;
  /* 柔和径向渐变背景增加层次感 */
  background: radial-gradient(circle at center, #1f1f1f 0%, #121212 100%);
  color:#4ade80;
  font-family: "JetBrains Mono", Consolas, monospace;
  display:flex;
  align-items:center;
  justify-content:center;
  height:100vh;
  overflow:hidden;
}
.wrap{
  padding: 40px 50px;
  background:rgba(30,30,30,0.55);
  border-radius:16px;
  border:1px solid rgba(74,222,128,0.2);
  box-shadow: 0 0 35px rgba(74,222,128,0.12);
}
#text{
  font-size:32px;
  line-height:1.6;
  min-height: 52px;
  border-right:4px solid #4ade80;
  padding-right:6px;
  animation: blink 0.7s infinite;
  white-space: pre-wrap;
}
/* 光标闪烁动画优化，过渡更柔和 */
@keyframes blink {
  0% {border-color:#4ade80;}
  45% {border-color:#4ade80;}
  50% {border-color:transparent;}
  95% {border-color:transparent;}
  100% {border-color:#4ade80;}
}
</style>
</head>
<body>
<div class="wrap">
  <div id="text"></div>
</div>

<script>
// ========== 修改这里替换文字，支持换行 ==========
const textList = [
  "Hello, 这是好玩的HTML页面✨",
  "打字机动画效果升级",
  "文字可以自由切换，动画丝滑流畅"
];
const speed = 80; // 打字速度，数值越小越快
const waitTime = 1800; // 打完一行后停留时间
const el = document.getElementById('text');

let strIndex = 0;
let charIndex = 0;
let isDeleting = false;

function type() {
  const currentStr = textList[strIndex];
  if(!isDeleting){
    // 打字
    el.innerText = currentStr.substring(0, charIndex + 1);
    charIndex++;
    if(charIndex === currentStr.length){
      isDeleting = true;
      setTimeout(type, waitTime);
      return;
    }
  }else{
    // 删除文字
    el.innerText = currentStr.substring(0, charIndex - 1);
    charIndex--;
    if(charIndex === 0){
      isDeleting = false;
      strIndex = (strIndex + 1) % textList.length;
    }
  }
  setTimeout(type, isDeleting ? 40 : speed);
}
type();
</script>
</body>
</html>
