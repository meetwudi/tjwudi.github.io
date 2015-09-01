title: 深入理解JavaScript中的this关键字
date: 2015-08-31 12:44:14
category: Engineering
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
  }
};

xiaoming.run();
```

在上面的例子中，第8行中的`xiaoming`指定了`run`方法运行时的主语。因此，在`run`中，我们才可以用`this`来代替`xiaoming`这个对象。可以看到`this`起了代词的作用。
