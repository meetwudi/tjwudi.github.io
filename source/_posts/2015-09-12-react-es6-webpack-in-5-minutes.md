title: 5分钟内使用React、Webpack与ES6构建应用
category: Tools
date: 2015-09-12 11:54:02
---


假设你想要非常快速地搭建一个React应用，或者你想快速地搭建用ES6学习React开发的环境，那么这篇文章你一定不想错过。

<!-- more -->

我们将使用[webpack](https://github.com/webpack/webpack)作为打包工具。我们使用webpack来将ES6代码转译成ES5代码，编译Stylus样式等。如果你没有安装webpack则需先安装它。

```
$ npm install -g webpack
$ npm install -g webpack-dev-server
```

如果遇到类似**EACESS**错误，则需要用超级用户的模式运行

```
$ sudo npm install -g webpack
$ sudo npm install -g webpack-dev-server
```

接下来创建项目的目录，并且安装[hjs-webpack](https://github.com/HenrikJoreteg/hjs-webpack)。

```
$ mkdir react-playground && cd $_
$ npm init -y
$ npm install hjs-webpack --save

# 检查npm版本
$ npm -v

# 如果npm版本是3.x.x或者更高执行下面这句
$ npm i --save autoprefixer babel babel-loader css-loader json-loader postcss-loader react react-hot-loader style-loader stylus-loader url-loader webpack-dev-server yeticss
```

hjs-webpack是一个简化webpack配置流程的工具，它免去了配置复杂的webpack选项的流程。

在项目根目录下创建**webpack.config.js**。

```js
var getConfig = require('hjs-webpack')


module.exports = getConfig({
  // 入口JS文件的位置
  in: 'src/app.js',

  // 应用打包（build）之后将存放在哪个文件夹 
  out: 'public',

  // 是否在每次打包之前将之前的打包文件
  // 删除
  clearBeforeBuild: true
})
```

**好了，现在所有的配置都完成了！**让我们开始构建React应用吧！创建**src/app.js**。

```js
import React from 'react'

class MyApp extends React.Component {
    render () {
        return <h1>Wonderful App</h1>
    }
}

React.render(<MyApp />,
    document.body)
```

接下来启动webpack的开发服务器。它的主要作用是在后台监控文件变动，在每次我们修改文件的时候动态地帮我们进行打包。

```
$ webpack-dev-server
```

打开[http://localhost:3000](http://localhost:3000)，你就能看到你刚才创建的React应用了！

{% asset_img first-react-app.png React应用 %}

注意到，在这里我们已经可以使用ES6的语法来创建应用了。

### CSS加载和自动刷新

创建**src/style.css**。

```css
body {
    background-color: red;
}
```

然后在**src/app.js**中加载它。

```js
import React from 'react'

// 加载CSS
require('./style.css')

class MyApp extends React.Component {
    render () {
        return <h1>Wonderful App</h1>
    }
}

React.render(<MyApp />,
    document.body)
```

接下来回到你的页面（不用刷新），Blah！整个页面突然充满了喜庆（又血腥）的红色。

这里你可以注意到两点。第一，CSS可以直接通过JavaScript来加载，这是webpack打包的功能之一，它会加载CSS文件并为我们插入到页面上；第二，我们保存后无需刷新就可以刷新页面，这是webpack-dev-server监控到了文件变化，动态打包后自动为我们刷新了页面。这又称作**live reload**。

### 总结

我们其实还可以使用一些[Yeoman](http://yeoman.io/)的脚手架来生成React应用，但是大部分配置依然复杂。hjs-webpack提供了简洁明了的配置接口，适合快速地搭建项目原型、小型应用的开发或者React学习等目的。

