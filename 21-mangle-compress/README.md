# 压缩混淆

## 混淆（mangle）

## 压缩

只实现两部分：

- 删除 return 之后的不会执行到的语句
- 删除没有被使用的变量声明（死代码删除 Dead Code Elemation，简称 DCE）

