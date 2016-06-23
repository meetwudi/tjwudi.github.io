title: 指路Reactive Programming
date: 2016-03-02 19:58:21
category: Engineering
thumbnailImage: 4.png
---

我在工作中采用Reactive Programming（RP）已经有一年了，对于这个“新鲜”的辞藻或许有一些人还不甚熟悉，这里就和大家说说关于RP我的理解。希望在读完本文后，你能够用Reactive Extension进行RP。

<!-- more -->

需要说明的是，我实在不知道如何翻译Reactive Programming这个词组，所以在本文中均用RP代替，而不是什么“响应式编程”、“反应式编程”。本文假定你对JavaScript及HTML5有初步的了解，如果有使用过，那么就再好不过了。

让我们首先来想象一个很常见的交互场景。当用户点击一个页面上的按钮，程序开始在后台执行一些工作（例如从网络获取数据）。在获取数据期间，按钮不能再被点击，而会显示成灰色的"disabled"状态。当加载完成后，页面展现数据，而后按钮又可以再次使用。（如下面例子的这个load按钮）

<a class="jsbin-embed" href="http://jsbin.com/yaneve/embed?js,output">JS Bin on jsbin.com</a>

在这里我使用jQuery编写了按钮的逻辑，具体的代码是这样的。

```js
var loading = false;

$('.load').click(function () {
  loading = true;
  
  var $btn = $(this);
  
  $btn.prop('disabled', loading);
  $btn.text('Loading ...');
  
  $.getJSON('https://www.reddit.com/r/cats.json')
    .done(function (data) {
      loading = false;
      $btn.prop('disabled', loading);
      $btn.text('Load');
    
      $('#result').text("Got " + data.data.children.length + " results");
    });
});
```

对应的HTML：

```
<button class="load">Load</button>
<div id="result"></div>
```

不知道你有没有注意到，在这里`loading`变量其实是完全可以不用存在的。而我写出`loading`变量，就是为了抓住你的眼球。`loading`代表的是一个状态，意思是“我的程序现在有没有在后台加载程序”。

另外还有几个不是很明显的状态。比如按钮的`disabled`状态（由`$btn.prop('disabled')`获得），以及按钮的文字。在加载的时候，也就是`loading === true`的时候，按钮的`disable`状态会是`true`，而文字会是`Loading ...`；在不加载的时候，`loading === false`成立，按钮的`disabled`状态就应该为`false`，而文字就是`Load`。

现在让我们用静态的图来描述用户点击一次按钮的过程。

{% asset_img 1.png 用户点击一次按钮的过程 %}

如果用户点击很多次的按钮的话，那么`loading`的值的变化将是这样的。

```js
loading: false -> true -> false -> true -> false -> true -> ...
```

类似像`loading`这样的**状态（state）**在应用程序中随处可见，而且其值的变化可以不局限于两个值。举个栗子，假如我们现在设计微博的前端，一条微博的JSON数据形式如下：

```
var aWeibo = {
    user: 1,
    text: '我今天好高兴啊！'
};
```

另外有一个`weiboList`数组，存储当前用户所看到的微博。

```
var weiboList = [
    {user: 1, text: '今天又出去玩了'},
    {user: 2, text: '人有多大胆，地有多大产！'}，
    // ...
]
```

这当然是个极度精简的模型了，真实的微博应用一定比这个复杂许多。但是有一个和`loading`状态很类似的就是`weiboList`，因为我们都知道每过一段时间微博就会自动刷新，也就是说`weiboList`也在一直经历着变化。

```
weiboList: [一些微博] -> [旧的微博，和一些新的微博] -> [更多的微博] -> ...
```

再次强调，无论是`weiboList`还是`loading`，它们都是应用程序的状态。上面的用箭头组成的示意图仅仅是我们对状态变化的一种展现形式（或者说建模）。然而，我们其实还可以用更加简单的模型来表现它，而这个模型我们都熟悉 —— 数组。

### 如果它们都只是数组

如果说`loading`变化的过程就是一个数组，那么不妨把它写作：

```js
var loadingProcess = [false, true, false, true, false, ...]
```

为了表现出这是一个过程，我们将其重新命名为`loadingProcess`。不过它没有什么不同，它是一个数组。而且我们还可以注意到，按钮的`disabled`状态的变化过程和`loadingProcess`的变化过程是一模一样的。我们将`disabled`的变化过程命名为`disabledProcess`。

```js
var disabledProcess = [false, true, false, true, false, ...]
```

那么如果将`loadingProcess`做下面的处理，我们将得到什么呢？

```js
var textProcess = loadingProcess.map(function(loading) {
    return loading ? "Loading ..." : "Load"
});
```

我们得到的将是按钮上文字的状态变化过程，也就是`$btn.text()`的值。我们将其命名为`textProcess`。在有了`textProcess`和`disabledProcess`之后，就可以直接对UI进行更新。在这里，我们不再需要使用到`loadingProcess`了。

```js
disabledProcess.forEach(function (disabled) {
    $btn.prop('disabled', disabled);
});
textProcess.forEach(function (text) {
    $btn.text(text);
});
```

这个变换的过程看起来就像下图。

{% asset_img 2.png 变换过程1 %}

在YY了那么久之后，你可能会说，不对啊！状态的变化是**一段时间内**发生的事情，在程序一开始怎么可能就知道之后的全部状态，并全部放到一个数组里面呢？是的，我们在之前刻意省略掉了一个重要的元素，也就是**时间（time）**。


### 时间都去哪儿啦？

`loadingProcess`是如何得出的？当用户触发按钮的点击事件的时候，`loadingProcess`会被置为`false`；而当HTTP请求完成的时候，我们将其置为`true`。在这里，用户触发点击事件，和HTTP请求完成都是一个需要时间的过程。用户的两次点击之间必定要有时间，就像这样：

> clickEvent ... clickEvent ...... clickEvent ..... clickEvent

两个clickEvent之间一个点我们假设代表一秒钟，用户点击的事件之间是由长度不同的时间间隔开的。

如果我们再尝试用刚才的方法，把click事件表示成一个数组，就会觉得特别的古怪：

```
var clickEventProcess = [ clickEvent, clickEvent, clickEvent, clickEvent, clickEvent, ... ]
```

你会想，古怪之处在于，这里没了时间的概念。其实不一定是这样的。你觉得这里少了时间，只是因为你被我刚才的例子所迷惑了。你的脑袋里面可能是在想下面的这段代码：

```js
// 代码A
clickEventProcess.forEach(function (clickEvent) {
   // ... 
});
```

如果是下面这段代码，我相信你再熟悉不过了，你还会觉得奇怪吗？

```js
// 代码B
document.querySelector('.load').addEventListener('click', function (clickEvent) {
    // ...
});
```

代码A中，我们所看到的是迭代器模式（Iterative Pattern）。所谓迭代器模式是对遍历一个集合的算法所进行的抽象。对于一个数组、一个二叉树和一个链表的遍历算法各不相同，但我都可以用统一的一个接口来获取遍历的结果。`forEach`就是一个例子。

```js
数组.forEach(function (元素) { /* ... */});
二叉树.forEach(function (元素) { /* ... */});
链表.forEach(function (元素) { /* ... */});
```

虽然每个`forEach`的实现方式一定不同，但是只要接口（即`forEach`这个名字以及`元素`这个参数）一致，我就可以遍历它们之中任何的一个，不管是数组、二叉树还是二郎神。只要它们都是实现了`forEach`的集合。

下面这句话希望你仔细品味：

> 迭代器模式的一个最大的特点就是，数据是由你向集合索要过来的。

在使用迭代器的时候，我们其实就是在向集合要数据，而且每次都企图一次性要完。

```js
[1,2,3,4,5].forEach(function (num) {
    console.log(num); 
});
```

这就好像在对集合说，你把那五个数字给我吧，快点儿，一个接一个一次性给完。在生活中，就好像蛋糕店的服务员帮你切蛋糕一样。你总是在和服务员说，麻烦你再给我下一块，再给我下一块……

{% asset_img 3.png 切蛋糕-迭代器 %}

而代码B是截然相反的。在代码B中，我们是在等待着数据被**推送**过来。又拿切蛋糕为例，这次就好像是你一言不发，而服务员一直跟你说，“这块切好了，给你！”。

{% asset_img 4.png 切蛋糕-推送 %}

如果你对设计模式熟悉的话，你应该知道代码B的模式叫做观察者模式（Observer Pattern）。所谓观察者模式，就是你观察集合，当集合告诉你它有元素要给你的时候，你就可以拿到元素。`addEventListener`本身就是一个很好的观察者模式的例子。

在切蛋糕的例子中，当你双目注视的服务员，耳朵竖得高高的，你就是在对服务员进行观察。每当服务员告诉你，有一块新的蛋糕切好了，你就过去拿。

### 迭代器和观察者的对立和统一

迭代器模式和观察者模式本质上是对称的。它们相同的地方在于：

1. 都是对集合的遍历（都是那块大蛋糕）
2. 每次都只获得一个元素

他们完全相反的地方只有一个：迭代器模式是你主动去要数据，而观察者模式是数据的提供方（切蛋糕的服务员）把数据推给你。他们其实完全可以用同样的接口来实现，例如前面的例子中的代码A，我们来回顾一下：

```js
// 代码A
clickEventProcess.forEach(function (clickEvent) {
   // ... 
});
```

对于代码B，我们可以进行如下的改写

```js
// 代码B
clickEventProcess.forEach = function(fn) {
    this._fn = fn; 
};

clickEventProcess.onNext = function(clickEvent) {
    this._fn(clickEvent);  
};

document.querySelector('.load').addEventListener('click', function (clickEvent) {
    clickEventProcess.onNext(clickEvent);
});

clickEventProcess.forEach(function (clickEvent) {
   // ... 
});
```

我们解读一下修改过的代码B。

1. `clickEventProcess.forEach`: 它接受一个回调函数作为参数，并存储在`this._fn`里面。这是为了将来在`clickEventProcess.onNext`里面调用
2. 当clickEvent触发的时候，调用`clickEventProcess.onNext(clickEvent)`，将`clickEvent`传给了`clickEventProcess`
3. `clickEventProcess.onNext`将`clickEvent`传给了`this._fn`，也就是之前我们所存储的回调函数
4. 回调函数正确地接收到新的点击事件

来看看现在发生了什么……迭代器模式和观察者模式用了同样的接口（API）实现了！因为，它们本质上就是对称的，能用同样的API将两件原本对称的事物给统一起来，这是可以做到的。

迭代器模式，英文叫做Iterative，由你去迭代数据；而观察者模式，要求你对数据来源的事件做出反应（react），所以其实也可以称作是Reactive（能做出反应的）。Iterative和Reactive，互相对称，相爱不相杀。

> 话外音：在这里我没有明确提及，实际上在观察者模式中数据就是以流（stream）的形式出现。而所谓数组，不过就是无需等待，马上就可以获得所有元素的流而已。从流的角度来理解Iterative和Reactive的对称性也可以，这里我们不多加阐述。

### Reactive Extension

上面代码B中我们最后获得了一个新的`clickEventProcess`，它不是一个真正意义上的集合，却被我们抽象成了一个集合，一个被时间所间隔开的集合。 [Rx.js，也称作Reactive Extension](https://github.com/Reactive-Extensions/RxJS)提供给了抽象出这样集合的能力，它把这种集合命名为`Observable`（可观察的）。

添加Rx.js及其插件Rx-DOM.js。我们需要Rx-DOM.js，因为它提供网络通讯相关的Observable抽象，稍后我们就会看到。

```html
<script src="https://cdn.rawgit.com/Reactive-Extensions/RxJS/master/dist/rx.all.min.js"></script>
<script src="https://cdn.rawgit.com/Reactive-Extensions/RxJS-DOM/master/dist/rx.dom.min.js"></script>
```

只需要很简单的一句工厂函数（factory method）就可以将鼠标点击的事件抽象成一个`Observable`。Rx.js提供一个全局对象`Rx`，`Rx.Observable`就是Observable的类。

```js
var loadButton = document.querySelector('.load');
var resultPanel = document.getElementById('result');

var click$ = Rx.Observable.fromEvent(loadButton, 'click');
```

`click$`就是前面的`clickEventProcess`，在这里我们将所有的Observable变量名结尾都添加`$`。点击事件是像下面这样子的：

```
[click ... click ........ click .. click ..... click ..........]
```

每个点击事件后应该发起一个网络请求。

```js
var response$$ = click$.map(function () {
   // 为了不处理跨域问题，这里换了个地址，返回和前面是一样的
   return Rx.DOM.get('http://output.jsbin.com/tafulo.json');
});
```

`Rx.DOM.ajax.get`会发起HTTP GET请求，并返回响应（Response）的Observable。因为每次请求只会有一个响应，所以响应的Observable实际上只会有一个元素。它将会是这样的：

```
[...[.....response].......[........response]......[....response]...........[....response]......[....response]]
```

由于这是Observable的Observable，就好像二维数组一样，所以在变量名末尾是`$$`。 若将click$和response$$的对应关系勾勒出来，会更加清晰。

{% asset_img 5.png %}

然而，我们更希望的是直接获得Response的Observble，而不是Response的Observble的Observble。Rx.js提供了`.flatMap`方法，可以将二维的Observable“摊平”成一维。你可以参考[underscore.js里面的`flatten`方法](http://underscorejs.org/#flatten)，只不过它是将普通数组摊平，而非将Observable摊平。

```js
var response$ = click$.flatMap(function () {
   return Rx.DOM.get('http://output.jsbin.com/tafulo.json');
});
```

图示：

{% asset_img 6.png %}


对于每一个click事件，我们都想将`loading`置为`true`；而对于每次HTTP请求返回，则置为`false`。于是，我们可以将`click$`映射成一个纯粹的只含有`true`的Observable，但其每个`true`到达的事件都和点击事件到达的时间一样；对于`response$`，同样，将其映射呈只含有`false`的Observable。最后，我们将两个Observable结合在一起（用`Rx.Observable.merge`），最终就可以形成`loading$`，也就是刚才我们的`loadingProcess`。

此外，`$loading`还应有一个初始值，可以用`startWith`方法来指定。

```js
var loading$ = Rx.Observable.merge(
    click$.map(function () { return true; }),
    response$.map(function () { return false; })
).startWith(false);
```

整个结合的过程如图所示

{% asset_img 7.png %}

有了`loading$`之后，我们很快就能得出刚才我们所想要的`textProcess`和`enabledProcess`。`enabledProcess`和`loading$`是一致的，就无需再生成，只要生成`textProcess`即可（命名为`text$`）。

```js
var text$ = loading$.map(function (loading) {
    return loading ? 'Loading ...' : 'Load';
});
```

在Rx.js中没有`forEach`方法，但有一个更好名字的方法，和`forEach`效用一样，叫做`subscribe`。这样我们就可以更新按钮的样式了。

```
text$.subscribe(function (text) {
  $loadButton.text(text);
});
loading$.subscribe(function (loading) {
  $loadButton.prop('disabled', loading);
});

// response$ 还可以拿来更新#result的内容
response$.subscribe(function (data) {
  $resultPanel.text('Got ' + JSON.parse(data.response).data.children.length + ' items');
});
```

这样就用完全Reactive的方式重构了之前我们的例子。

<a class="jsbin-embed" href="http://jsbin.com/wurite/embed?html,js,output">JS Bin on jsbin.com</a>

在我们重构后的方案中，消灭了所有的状态。状态都被Observable抽象了出去。于是，这样的代码如果放在一个函数里面，这个函数将是没有副作用的纯函数。关于纯函数、函数式编程，可以阅读我的文章[《“函数是一等公民”背后的含义》](http://blog.leapoahead.com/2015/09/19/function-as-first-class-citizen/)。

### 总结

本文从应用的角度入手解释了Reactive Programming的思路。Observable作为对状态的抽象，统一了Iterative和Reactive，淡化了两者之间的边界。当然，最大的好处就是我们用抽象的形式将烦人的状态赶出了视野，取而代之的是可组合的、可变换的Observable。

事物之间的对立统一通常很难找到。实际上，即使是在《设计模式》这本书中，作者们也未曾看到迭代器模式和观察者模式之间存在的对称关系。在UI设计领域，我们更多地和用户驱动、通信驱动出来的事件打交道，这才促成了这两个模式的合并。

<script src="http://static.jsbin.com/js/embed.min.js?3.35.9"></script>
