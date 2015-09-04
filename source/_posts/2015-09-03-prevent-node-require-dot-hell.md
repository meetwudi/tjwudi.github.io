title: 在Node应用中避免“Dot Hell”
category: Engineering
thumbnailImage: cat.png
date: 2015-09-03 00:38:51
---


在Node应用中，我们使用`require`来加载模块。在目录层次相对复杂的应用中，总是会出现类似`require('../../../../../module')`的调用，我把它称之为Dot Hell。我用了一些时间研究现有的解决方案，并介绍我个人认为最好的方法。

<!-- more -->

{% asset_img cat.png %}

在Node中的全局对象是`global`，它就像浏览器的`window`对象一样。`global`对象下面的方法都可以直接调用。

```js
global.a = 1
require('assert').equal(1, a)
```

因此最简单的方法，也是我认为最好的方式就是在`global`下创建一个`appRequire`方法作为`require`方法的包装，`appRequire`方法专门用于调用应用内的包。

```js
var path = require('path')
global.appRequire = function(path) {
    return require(path.resolve(__dirname, path))
}
```

假设我们的项目目录结构如下

```
├── app
│   ├── controller
│   │   └── AppController.js
│   ├── model
│   │   └── User.js
│   └── view
│       └── AppView.js
└── app.js
```

其中**app.js**是应用的入口。那么我们只需要在**app.js**中应用上面的代码，那么在整个应用程序中就都可以使用了。

例如，现在在**app/controller/AppController.js**中，我们可以用下面的语句调用**app/model/User.js**。

```js
var User = appRequire('app/model/User')
```

Oh Yeah! 一切都很优雅，很顺利。

但是一个应用中一定还会有测试代码。以单元测试为例，我们如果用[mocha](https://mochajs.org/)之类的Task Runner去运行测试的话，就得在每个测试前面都加上这一段代码，这样做很容易出错，而且很麻烦。

所以，我们可以把上述的封装代码单独封装成一个文件**global-bootstrap.js**，在运行mocha的时候，用mocha的require参数来指定每次运行测试之前要加载**global-bootstrap.js**。

```js
# 用Mocha运行tests文件夹下面的所有测试
# 在运行的时候加载should库，以及我们封装的含有appRequire函数的文件
mocha --require should --require global-bootstrap.js --recursive tests
```

### 其他方案

对于解决这个问题，还有两种方案：**NODE_ENV方案（及其变种）**和**Symlink方案**，你可以[在这里](https://gist.github.com/branneman/8048520)看到。

我认为应该避免使用这两种方案。虽然这两种方案都可行，但是它们都会可能导致应用自身的目录名和node模块名冲突。例如，在下面的结构中，使用`require('request')`就很容易产生二义性。

```
.
├── node_modules
│   └── request
└── request
    └── index.js
```

### 总结

我一直认为Node的模块引用方式的设计是有问题的，Dot Hell就很能说明这点。而Python相对而言就优雅很多，你可以直接通过路径的形式来导入包（在正确配置的情况下）。本文的解决方案允许我们用类似Python的方式去加载模块，你可以在我的项目[webcraft](https://github.com/tjwudi/webcraft)中看到其应用。