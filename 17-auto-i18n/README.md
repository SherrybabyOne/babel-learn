# 自动国际化插件

## 目标

对于字符串：

```js
const a = '中文';

// 替换为：
import intl from 'intl';

const a = intl.t('intl1');
```

对于模版字符串：

```js
const name = 'babel';
const str = `你好 ${name}`;

// 替换为：
import intl from 'intl';

const name = 'babel';
const str = intl.t('intl2', name);
```

## 实现步骤

1. 如果没有引入 intl 模块，就自动引入，并且生成唯一的标识符，不和作用域的其他声明冲突。
2. 把字符串和模版字符串替换为 `intl.t` 的函数调用的形式。
3. 把收集到的值收集起来，输出到一个资源文件中。

在 JSX 中需要加上 `{}`：

```jsx
const a = <component content="content"></component>;

// 替换为：
import intl from 'intl';

const a  = <component content={ intl.t('intl2') }></component>;
```

不需要转换的，需要注视来解决:

```js
const a = /*i18n-disable*/'content';
```

## 预期效果

输入：

```js
import intl from 'intl2';
/**
 * App
 */
function App() {
  const title = 'title';
  const desc = 'desc';
  const desc2 = /* i18n-disable */ 'desc';
  const desc3 = `aaa ${title + desc} bbb ${desc2} ccc`;

  return (
    <div className="app" title={'测试'}>
      <img src={Logo} />
      <h1>${title}</h1>
      <p>${desc}</p>
      <div>{/* i18n-disable */ '中文'}</div>
    </div>
  );
}
```

输出：

```js
import _intl from 'intl';
import intl from 'intl2';
/**
 * App
 */

function App() {
  const title = _intl.t('intl1');

  const desc = _intl.t('intl2');

  const desc2 = `desc`;

  const desc3 = _intl.t('intl3', title + desc, desc2);

  return <div className={_intl.t('intl4')} title={_intl.t('intl5')}>
        <img src={Logo} />
        <h1>${title}</h1>
        <p>${desc}</p>  
        <div>
        {'中文'}
        </div>
      </div>;
}
```

并将生成相应的资源文件：

```js
const resource = {
    "intl1": "title",
    "intl2": "desc",
    "intl3": "aaa {placeholder} bbb {placeholder} ccc",
    "intl4": "app",
    "intl5": "测试"
};
export default resource;
```
