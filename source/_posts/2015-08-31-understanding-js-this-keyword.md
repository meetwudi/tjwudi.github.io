title: 用自然语言的角度理解JavaScript中的this关键字
date: 2015-08-31 12:44:14
category: Engineering
thumbnailImage: what_is_this.png
---

在编写JavaScript应用的时候，我们经常会使用`this`关键字。那么`this`关键字究竟是怎样工作的？它的设计有哪些好的地方，有哪些不好的地方？本文带大家全面系统地认识这个老朋友。

{% asset_img "what_is_this.png" WHAT IS THIS %}

> 小明正在跑步，他看起来很开心

这里的小明是**主语**，如果没有这个主语，那么后面的代词『他』将毫无意义。有了主语，代词才有了可以指代的事物。

类比到JavaScript的世界中，我们在调用一个对象的方法的时候，需要先指明这个对象，再指明要调用的方法。

```js
var xiaoming = {
  name: 'Xiao Ming',
  run: function() {
    console.log(`${this.name} seems happy`);
  },
};

xiaoming.run();
```

[在线演示](http://jsbin.com/nawesuhoxu/edit?js,console)

在上面的例子中，第8行中的`xiaoming`指定了`run`方法运行时的主语。因此，在`run`中，我们才可以用`this`来代替`xiaoming`这个对象。可以看到`this`起了代词的作用。

同样的，对于一个JavaScript类，在将它初始化之后，我们也可以用类似的方法来理解：类的实例在调用其方法的时候，将作为主语，其方法中的`this`就自然变成了指代主语的代词。

```js
class People {
  constructor(name) {
    // 在用new关键字实例化一个对象的时候，相当于在说，
    // “创建一个People类实例（主语），它（this）的name是……”
    // 所以这里的this就是新创建的People类实例
    this.name = name;
  }
  
  run() {
    console.log(`${this.name} seems happy.`)  
  }
}

// new关键字实例化一个类
var xiaoming = new People('xiaoming');
xiaoming.run();
```

[在线演示](http://jsbin.com/nanujaheyu/edit?js,console)

这就是我认为this关键字设计得精彩的地方！如果将调用方法的语句（上面代码的第16行）和方法本身的代码连起来，像英语一样读，其实是完全通顺的。

### `this`的绑定

句子的主语是可以变的，例如在下面的场景中，`run`被赋值到小芳（`xiaofang`）身上之后，调用`xiaofang.run`，主语就变成了小芳！

```js
var xiaofang = {
  name: 'Xiao Fang',
};

var xiaoming = {
  name: 'Xiao Ming',
  run: function() {
    console.log(`${this.name} seems happy`);
  },
};

xiaofang.run = xiaoming.run;
// 主语变成了小芳
xiaofang.run();
```

[在线演示](http://jsbin.com/siherigulo/1/edit?js,console)

在这种情况下，句子还是通顺的。所以，非常完美！

{% asset_img this_is_perfect.png 非常完美！ %}

但是如果小明很抠门，不愿意将`run`方法借给小芳以后，`this`就变成了小芳的话，那么小明要怎么做呢？他可以通过[Function.prototype.bind](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)让`run`运行时候的`this`永远为小明自己。

```js
var xiaofang = {
  name: 'Xiao Fang',
};

var xiaoming = {
  name: 'Xiao Ming',
  run: function() {
    console.log(`${this.name} seems happy`);
  },
};

// 将小明的run方法绑定（bind）后，返回的还是一个
// 函数，但是这个函数之后被调用的时候就算主语不是小明，
// 它的this依然是小明
xiaoming.run = xiaoming.run.bind(xiaoming);

xiaofang.run = xiaoming.run;
// 主语虽然是小芳，但是最后this还是小明
xiaofang.run();
```

[在线演示](http://jsbin.com/reforakoja/1/edit?js,console)

那么同一个函数被多次`bind`之后，到底`this`是哪一次`bind`的对象呢？你可以自己尝试看看。

### `call`与`apply`

[Function.prototype.call](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/call)允许你在调用一个函数的时候指定它的`this`的值。

```js
var xiaoming = {
    name: 'Xiao Ming'
};

function run(today, mood) {
    console.log(`Today is ${today}, ${this.name} seems ${mood}`);
}

// 函数的call方法第一个参数是this的值
// 后续只需按函数参数的顺序传参即可
run.call(xiaoming, 'Monday', 'happy')
```

[在线演示](http://jsbin.com/xuvugihuda/1/edit?js,console)

[Function.prototype.apply](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/apply)和`Function.prototype.call`的功能是一模一样的，区别进在于，`apply`里将函数调用所需的所有参数放到一个数组当中。

```js
var xiaoming = {
    name: 'Xiao Ming'
};

function run(today, mood) {
    console.log(`Today is ${today}, ${this.name} seems ${mood}`);
}

// apply只接受两个参数
// 第二个参数是一个数组，这个数组的元素被按顺序
// 作为run调用的参数
run.apply(xiaoming, ['Monday', 'happy'])
```

[在线演示](http://jsbin.com/safupufuca/1/edit?js,console)

那么`call`/`apply`和上面的`bind`混用的时候是什么样的行为呢？这个也留给大家自行验证。但是在一般情况下，我们应该避免混用它们，否则会造成代码检查或者调试的时候难以跟踪`this`的值的问题。

### 当方法失去主语的时候，`this`不再有？

其实大家可以发现我的用词，当一个`function`被调用的时候是有主语的时候，它是一个**方法**；当一个`function`被调用的时候是没有主语的时候，它是一个**函数**。当一个函数运行的时候，它虽然没有主语，但是它的`this`的值会是全局对象。在浏览器里，那就是`window`。当然了，前提是函数没有被`bind`过，也不是被`apply`或`call`所调用。

那么`function`作为函数的情景有哪些呢？

首先，全局函数的调用就是最简单的一种。

```js
function bar() {
  console.log(this === window); // 输出：true
}
bar();
```

立即调用的函数表达式（IIFE，Immediately-Invoked Function Expression）也是没有主语的，所以它被调用的时候`this`也是全局对象。

```js
(function() {
  console.log(this === window); // 输出：true
})();
```

[在线演示（包含上面两个例子）](http://jsbin.com/qavagatuya/1/edit?js,console)

但是，当函数被执行在严格模式（strict-mode）下的时候，函数的调用时的this就是`undefined`了。这是很值得注意的一点。

```js
function bar() {
  'use strict';
  console.log('Case 2 ' + String(this === undefined)); // 输出：undefined
}
bar();
```

### 不可见的调用

有时候，你没有办法看到你定义的函数是怎么被调用的。因此，你就没有办法知道它的主语。下面是一个用jQuery添加事件监听器的例子。

```js
window.val = 'window val';

var obj = {
  val: 'obj val',
  foo: function() {
    $('#text').bind('click', function() {
      console.log(this.val);
    });
  }
};

obj.foo();
```

[在线演示](http://jsbin.com/yeweyoliva/1/edit?js,console,output)

在事件的回调函数（第6行开始定义的匿名函数）里面，`this`的值既不是`window`，又不是`obj`，而是页面上`id`为`text`的HTML元素。

```js
var obj = {
  foo: function() {
    $('#text').bind('click', function() {
      console.log(this === document.getElementById('text')); // 输出：true
    });
  }
};

obj.foo();
```

[在线演示](http://jsbin.com/vikayufiso/1/edit?js,console,output)

这是因为匿名函数是被jQuery内部调用的，我们不知道它调用的时候的主语是什么，或者是否被`bind`等函数修改过`this`的值。所以，当你将匿名函数交给程序的其他部分调用的时候，需要格外地谨慎。

如果我们想要在上面的回调函数里面使用obj的`val`值，除了直接写`obj.val`之外，还可以在foo方法中用一个新的变量`that`来保存`foo`运行时`this`的值。这样说有些绕口，我们看下例子便知。

```js
window.val = 'window val';

var obj = {
  val: 'obj val',
  foo: function() {
    var that = this; // 保存this的引用到that，这里的this实际上就是obj
    $('#text').bind('click', function() {
      console.log(that.val); // 输出：obj val
    });
  }
};

obj.foo();
```

[在线演示](http://jsbin.com/fefozitake/1/edit?js,console,output)

另外一种方法就是为该匿名函数`bind`了。

```js
window.val = 'window val';

var obj = {
  val: 'obj val',
  foo: function() {
    $('#text').bind('click', function() {
      console.log(this.val); // 输出：obj val
    }.bind(this));
  }
};

obj.foo();
```

[在线演示](http://jsbin.com/kodupitade/1/edit?js,console,output)

### 总结

在JavaScript中`this`的用法的确是千奇百怪，但是如果利用自然语言的方式来理解，一切就顺理成章了。不知道你读完这篇文章时候理解了吗？还是睡着了？亲……醒醒……

如果有任何疑问，欢迎在评论区讨论。**另外，欢迎在下方订阅我的半月刊，我将为你分享有趣的技术、产品、设计的片段。**

<div style="width: 200px">
    {% asset_img oh_yeah.gif %}
</div>
