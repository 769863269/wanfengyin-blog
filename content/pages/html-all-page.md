---
title: HTML 完整版 - 测试
description: 点击彩色方块，每次点击会随机生成不同颜色，带发光阴影和缩放动效
status: published
directAccess: true
fullHtml: true
---

<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>点击变色方块</title>
    <style>
        * {margin:0;padding:0;box-sizing:border-box;}
        body {
            background: #111;
            min-height: 100vh;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            font-family:system-ui;
            color:#fff;
        }
        #box {
            width:180px;
            height:180px;
            background:#4285f4;
            border-radius:12px;
            cursor:pointer;
            transition: all 0.3s ease;
            box-shadow: 0 0 20px #4285f477;
        }
        #box:active{
            transform:scale(0.92);
        }
        p{
            margin-top:24px;
            font-size:16px;
        }
    </style>
</head>
<body>
    <div id="box"></div>
    <p>点一下方块，随机换颜色！</p>

    <script>
        const box = document.getElementById('box');
        function randomColor(){
            const r = Math.floor(Math.random()*256);
            const g = Math.floor(Math.random()*256);
            const b = Math.floor(Math.random()*256);
            return `rgb(${r},${g},${b})`;
        }
        box.onclick = ()=>{
            const color = randomColor();
            box.style.background = color;
            box.style.boxShadow = `0 0 20px ${color}77`;
        }
    </script>
</body>
</html>
