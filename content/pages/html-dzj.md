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
<title>打字机效果</title>
<style>
body{background:#1a1a1a;color:#4ade80;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
#text{font-size:28px;border-right:3px solid #4ade80;padding-right:4px;animation:blink 0.7s infinite}
@keyframes blink{0%{border-color:#4ade80}50%{border-color:transparent}}
</style>
</head>
<body>
<div id="text"></div>
<script>
const str = "Hello, 这是好玩的HTML页面✨";
let i=0;
const el = document.getElementById('text');
function type(){
  if(i<str.length){
    el.innerText += str[i];
    i++;
    setTimeout(type,120);
  }
}
type();
</script>
</body>
</html>
