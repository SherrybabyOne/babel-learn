# 禁止函数声明后的重新赋值

```js
function foo() {
  foo = bar;
}

let a = function hello() {
  hello = 123;
};
```

函数声明之后禁止重新被赋值。
