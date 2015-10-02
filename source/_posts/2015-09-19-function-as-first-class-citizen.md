title: “函数是一等公民”背后的含义
category: Engineering
date: 2015-09-19 01:37:41
thumbnailImage:
---


在学习一些语言的时候，你经常会听到“函数是一等公民”这样的描述。那么究竟函数在这类语言中扮演着怎么样的一个角色？它和函数式编程、无状态设计、封装抽象有什么千丝万缕的联系？

<!-- more -->

在本文中，我们用JavaScript为例，娓娓道来这其中的故事。当然了，只是我发现的这一部分……

### 时间的奥秘

我们从最简单的五行代码说起。

```js
function add (a, b) {
    return a + b
}
add(1, 2)
add(5, 2)
```

是的，我写JavaScript不加分号。当然，关键不是这个……

我们可以很轻松地写出关于这个函数的测试用例来。

```js
describe('add', () => {
    it('should return a + b', () => {
        add(1, 2).should.equal(3)
    })
})
```

但是如果我们引入一个全局的变量C。

```js
var C = 0
function addWithC (a, b) {
    return a + b + C
}
addWithC(1, 2) // 3
addWithC(5, 2) // 7
```

这个代码看起来还是很好测试的，只要你在测试中也能访问到`C`这个变量。你修改两三次`C`的值，然后运行几次被测试的函数，大概地看下结果是不是正确“就行了”。

慢着，看似平静的表象下，就是一切问题的开始。我们编写一个函数，里面只是简单地调用`addWithC`。

```js
function foo (a, b) {
    return addWithC(a, b)
}
```

`foo`在这里成为了`addWithC`的一个抽象。你怎么样**较为全面地**测试`foo`？很显然，你依然还是要在它的测试里面去引用到`C`。

好的，在这里，`C`就成为了一种**状态(State)**，它的变化可以左右函数的输出。

```js
addWithC(1, 2) // 3
C = 1
addWithC(1, 2) // 4
```

第二句`C = 1`的玄妙之处在于，它在这三行代码中创建了“时间”这个纬度。你可能在想，这是什么鬼话？

别急，请仔细看。在阅读这份代码的时候，我们会说：

> 在`C = 1`之前，`addWithC(1, 2)`的结果是3；在`C = 1`之后，`addWithC(1, 2)`的结果是4。

看，这不就是时间吗？我们在这里有了之前和之后的概念。这也称作“副作用” —— `C`的变化对`addWithC`的结果产生了**副作用**。

如果我们回到引用`C`这个状态之前的`add`函数呢？

```js
add(1, 2) // 3
add(4, 5) // 9
```

我们会说：

> `add(1, 2)`的结果就是3；`add(4, 5)`的结果就是9

`add`比`addWithC`来得好测试。为什么呢？因为**对于固定的输入，`add`总是可以有固定的输出**。但是`addWithC`并不是这样的，因为在不同的“时间”里（也就是状态取不同的值的时候），它对于同样的输入，不一定有同样的输出。

其实这一点在编写测试的时候，编写行为描述的时候就可以发现了。在进行[行为驱动开发](https://zh.wikipedia.org/zh/%E8%A1%8C%E4%B8%BA%E9%A9%B1%E5%8A%A8%E5%BC%80%E5%8F%91)编写行为描述的时候，我们应该描述清楚被测函数的下面几个方面

- 它所期待的输入是什么
- 输入所对应的输出是什么

例如，对于`add`，我就可以写道

```js
it('should return sum of a and b', ...)
```

对于`addWithC`，我们要写

```js
it('should return sum of a, b and an external C', ...)
```

看到了吧，通过编写行为描述，我们发现在单元测试中，竟然还引入了外部变量。这还能叫单元测试吗？

很多时候，我们可能会选择破例在单元测试里面引入状态，而不去思考重新修改代码。因此，系统中引入了越来越多的状态，直到混乱不堪，难以测试……

所以我们看到，在这里，**状态**是导致混乱的最主要原因。实际上，它也是导致很多系统难以测试，经常崩溃的原因。

### 外部量C何去何从？

但是在很多时候，我们是必须要依赖一些外部的量的，比如刚才的`C`。我们不希望引入状态，那么就有一个办法，那就是让`C`变成常量。

```js
const C = 1
```

这让它人不再能够修改这个量，那么我们就不必要在测试中引入C这个常量了。测试`addWithC`的代码就可以变得非常地简单：

```js
describe('addWithC', () => {
    it('should return sum of a, b and constant C (which is 1)', () => {
        add(1, 2).should.equal(4)
        // 没有副作用
        // 不会有时间的概念
    })
})
```

让我们思考得更深一点，常量就是什么？实际上就是一个返回固定值的函数。

```js
const C = 0
// 等价于
function C () {
    return 0
}
```

因此`addWithC`实际上可以是这样的。

```js
function addWithC(a, b) {
    return a + b + C()
}
```

那么这个时候，我们发现`C`和`addWithC`都符合一个原则。

> 输出仅取决于输入的参数。

对于这样的函数，我们又称之为**纯函数（Pure function）**，这个概念非常地重要。

奇妙的事情发生了。在一个无状态（Stateless）的世界里，所有的常量都被替换成返回固定值的函数，整个程序的运行无非就是一系列的函数调用。而且，这些函数还都是纯函数！等等，这难道不就是——

> **函数是一等公民**。（Function is first-class citizen）

这是学过JavaScript语言的人都耳熟能详一句话了，但是还是不够准确。毕竟在无状态的世界里，我们就可以用函数来抽象出所有的量了，那么更准确地说——

> **函数是_唯一_的一等公民**。（Function is the one and only first-class citizen）

我还是不满意，我必须强调“纯函数”这个概念。

> **_纯_函数是_唯一_的一等公民**。（Pure function is the one and only first-class citizen）

这样做的目的只有一个，**没有副作用**。

好了，所有复杂的问题都解决了，我们不要变量，只要常量，所有的事情都用一层层的纯函数调用来解决。程序员们解散吧，这么简单的事情，用不着那么多人来做……

呵呵。

### 无状态的乌托邦

上面说的这个世界太理想了。

程序语言给予了我们赋值的能力，给予了我们变量，难道我们就轻易地将它们抛弃吗？当然不是的。在一个局限的小范围内，实际上使用状态还是没有问题的。例如，一个简单的`for`循环本身也是Stateful的。

```js
var result = 0, upperBound = 10
for (var i = 1; i < upperBound; i ++) {
    result += i
}
```

这里的`result`本身依赖于`i`的取值，`i`也是一个状态。但是，如果它们被放在一个函数里：

```js
function seriesSum (upperBound) {
    var result = 0
    for (var i = 1; i < upperBound; i ++) {
        result += i
    }
    return result
}
```

我们来审视`seriesSum`。其输出依然是取决于其输入，哦耶！它还是一个纯函数，虽然它内部不是纯函数。`seriesSum`依然是一个很容易测试的单元。

需要注意的一点是，如果一个函数的输出取决于一个非纯函数的输出的话，那么它一定也不是纯函数。例如下面的场景中

```js
function foo (arg1, arg2) {
    // 这不是一个纯函数
}

function bar (arg1, arg2) {
    // 结果依赖于foo，依然不是一个纯函数
    result = foo(arg1, arg2) + ...
    return result
}
```

### 依赖注入（Dependency Injection）

如果你接触过[Angular.js](https://angularjs.org/)，你一定知道依赖注入（Dependency Injection）。

纯函数之所以易于测试，从某种角度上说是因为它的所有依赖就是它的参数，所以我们可以很容易地在测试的时候模拟其所有需要的依赖的变化进行测试。

依赖注入通过给所有我们需要用到的函数、量统一包装，也能实现类似的效果。

```js
angular.module('myModule', [])
.factory('serviceId', ['depService', function(depService) {
  // ...
}])
.directive('directiveName', ['depService', function(depService) {
  // ...
}])
.filter('filterName', ['depService', function(depService) {
  // ...
}])
```

例如在上面的例子中，如果我们要测试`serviceId`、`directiveName`或者`filterName`的话，那么只需要注入`depService`就好了。所以，依赖注入提供了跟虚函数一样的依赖跟踪性质，并且相对而言更加分散。但是依赖注入并不能保证每个模块暴露出来的都是虚函数。

### 面向对象怎么办？

好问题。（咦，好像夸的是我自己……）

一个对象内部的属性如果发生了变化，那么这个对象本质上就不再是之前那个对象了。例如下面的类：

```js
class MyClass {
    constructor () {
        this.someVar = 1
    }
    incSomeVar() {
        this.someVar++
    }
}

var myObj = new MyClass()
myObj.incSomeVar()
// myObj.someVar变化了
// 她便再也不是从前那个专一（1）的她…
```

我们不希望这样的事情发生，但又希望做出良好的封装性，那么怎么办呢？答案是让类实例不可变（Immuatable）。每次在对象内部的属性变化的时候，我们不直接修改这个对象，而是返回一个新的对象。

```js
class MyClass {
    constructor (someVar = 1) {
        this.someVar = someVar
    }
    incSomeVar() {
        return new MyClass(this.someVar + 1)
    }
}

var myObj = new MyClass()
console.log(myObj.someVar) // 1
var mySecondObj = myObj.incSomeVar()
console.log(myObj.someVar) // 1
console.log(mySecondObj.someVar) // 2
// 两者不指向同样的内存区域，故为false
console.log(myObj == mySecondObj)
```

这样做的理由很简单，产生一个新的对象不会对现有的对象产生影响，因此这个操作是**没有副作用**的，符合我们前面提到的我们的目标。

在JavaScript的世界里面，我们有[Immutable.js](https://facebook.github.io/immutable-js/)。Immutable.js封装了JavaScript原生类型的Immutable版本。例如`Immutable.Map`就是一个例子。

```js
var map1 = Immutable.Map({a:1, b:2, c:3});
var map2 = map1.set('b', 50);
map1.get('b'); // 2
map2.get('b'); // 50
```

实际上，在immutable的世界里，每一个对象永远都是它自己，不会被修改。所以，它可以被视为一个常量，被视为一个返回常量的值。这里精彩的部分在于：

> Hey，Immutable将变量给常量化了！

显而易见，这样做看似会导致很多不必要的内存开销。其实Immutable数据结构本身会重复利用很多的内存空间，例如链表、Map之类的数据结构，库都会尽量重用可以重用的部分。

在实在无法重用的时候，完全复制在99%的情况下也是没有任何问题的。现在内存那么便宜，你确定你真的对那不必要的几KB几MB的开销很上心吗？大部分时候，并没有必要节约那一点内存，尤其是在浏览器端。

### JavaScript与函数式编程

最后回到我们最熟悉的JavaScript的函数式编程上来，验证我们之前的一些发现。

```js
[1, 2, 3].map(i => i + 1)
    .filter(i => i > 2)
    .forEach(i => console.log(i))
// 输出3 4
```

首先，`map`、`filter`返回的都是一个新的数组，不对原有的数组进行修改。这里就表现出了Immutable的特性。其次，我们注意到`map`、`filter`和`forEach`函数都不依赖外界的状态。因此我们可以很容易地把它们拉出来测试。

如果我们依赖了外界的状态，那么就再也不是函数式编程了。

```js
var C = 1
[1, 2, 3].map(i => i + 1)
    .filter(i => i > 2)
    .forEach(i => console.log(i + C))
```

### 总结

总结下来，保持两点可以让我们的应用维护、测试复杂度显著降低。

第一点就是编写纯函数，保持Stateless，并对其进行测试。需要记住的是，我们不需要将所有的东西都变成Stateless的，至于如何设计那就真的是看经验了。

第二点就是应用Immutable数据结构，将变量常量化。

无论采用什么方法，总体目标就是**消除副作用**。这也是函数作为一等公民，将过程和量统一背后的实际意义。