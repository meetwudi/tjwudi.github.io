title: Workshop - 对Express中间件进行单元测试
category: Engineering
thumbnailImage: unittest.jpeg
date: 2015-09-09 19:21:33
---


我最近围绕着Express构建应用，尝试用不同的方法来对Express的中间件进行单元测试。今天通过Workshop的形式，一步一步地向大家介绍我的测试方式。

<!-- more -->

{% asset_img unittest.jpeg %}

本文要求读者有一定[Express.js](http://expressjs.com)基础，并对JavaScript的Promise特性有所了解。你可以在[这篇文章](http://www.html5rocks.com/zh/tutorials/es6/promises/)中学习到关于Promise的基础知识。

请在[GitHub](https://github.com/tjwudi/unit-testing-express-middlewares-example)上将我们学习用的代码clone到本地的任意目录。

```
$ git clone git@github.com:tjwudi/unit-testing-express-middlewares-example.git
$ cd unit-testing-express-middlewares-example
$ git checkout step1  # 回到第一步
$ npm install
$ node bin/www
```

在这个项目中，我们提供一个JSON接口`/users/:id`，返回对应用户`id`的用户信息，其中包含该用户所负责的项目（projects）。你可以访问`http://localhost:3000/users/1`看到下面的返回结果。

```
{
   "type":"User",
   "id":1,
   "name":"John Wu",
   "position":"Software Engineer",
   "_id":"UUTpdPICsQSLS5zp",
   "projects":[
      {
         "type":"Project",
         "user_id":1,
         "id":3,
         "title":"InterU",
         "_id":"QH8MxJKnAsHSwA5X"
      },
      {
         "type":"Project",
         "user_id":1,
         "id":1,
         "title":"Midway",
         "_id":"UnNJxQ7eopLlWFY1"
      },
      {
         "type":"Project",
         "user_id":1,
         "id":2,
         "title":"Esther",
         "_id":"gZe3sgOsKxxCXHBA"
      }
   ]
}
```

### 常规中间件用法

在**routes/users.js**中我们可以看到响应该请求的中间件，该请求由三个中间件组成，它们分别负责

1. 根据用户id从数据库获取用户对象，赋值给`req.user`
2. 根据用户对象获取其负责的所有项目，赋值给`req.projects`
3. 组合上面两步的结果，返回JSON

```js
router.get('/:id', function(req, res, next) {
  var userId = parseInt(req.params.id, 10);
  User.getUserById(userId).then(function (user) {
    req.user = user;
    next();
  });
}, function (req, res, next) {
  User.getUserProjects(req.user).then(function (projects) {
    req.projects = projects;
    next();
  });
}, function (req, res, next) {
  req.user.projects = req.projects;
  res.json(req.user);
});
```

到目前为止，一切都很完美！接下来我们希望能够针对每个中间件设计单元测试。

> 题外话：一般情况下，我们都会先设计单元测试，再进行具体实现。但是在这里出于Workshop目的，我们将顺序反过来。

**单元测试（Unit Testing）**中，我们针对函数这类小型的、符合[单一职责原则](http://www.uml.org.cn/sjms/201211023.asp)的功能单元进行测试。但是在对Express中间件进行单元测试的时候，我们可能遇到挑战。

### 直接对接口测试？

首先，我们可能尝试直接用类似[supertest](https://github.com/visionmedia/supertest#readme)的工具进行测试。

```js
var request = require('supertest');

request(app)
  .get('/users/1')
  .expect(200)
  .then(...);
```

但是这样做实际上已经不是单元测试了，而是对整个请求中涉及的所有中间件测试。如果我们不对这些中间件进行变动，但是插入了新的中间件，也可能导致这个测试失败，所以是不可取的。

为了解决这个为题，我们可以将中间件函数独立暴露出来，方便测试。

### Step 2：独立中间件

首先在**routes/users.js**中，我们将三个中间件单独提取到一个对象中，并暴露给外界。

```js
var middlewares = {
  getUserById: function (req, res, next) {
    var userId = parseInt(req.params.id, 10);
    User.getUserById(userId).then(function (user) {
      req.user = user;
      next();
    });
  },

  getProjectsForUser: function (req, res, next) {
    User.getUserProjects(req.user).then(function (projects) {
      req.projects = projects;
      next();
    });
  },

  responseUserWithProjects: function (req, res, next) {
    req.user.projects = req.projects;
    res.json(req.user);
  }
}

router.get('/:id',
  middlewares.getUserById,
  middlewares.getProjectsForUser,
  middlewares.responseUserWithProjects
);

module.exports = {
  router: router,
  middlewares: middlewares
}
```

接下来在**app.js**中的第27行更新router的引用

```js
app.use('/users', users.router);
```

你可以在项目目录下运行下面的命令让所有文件和上面所做的变更同步。

```js
$ git checkout step2
```

### Step 3：建立测试文件

接下来在项目目录下新建测试文件**tests/users.js**。我们将用[mocha](https://mochajs.org)和[should](https://github.com/shouldjs/should.js)进行测试。mocha是测试运行工具，用于执行测试；而should则是一个断言（assertion）库。

```
$ npm install -g mocha
$ npm install should --save-dev
```

另外我们使用[node-mocks-http](https://github.com/howardabrams/node-mocks-http)来创建模拟的`req`和`res`对象。

```
$ npm install node-mocks-http --save-dev
```

我们以下面的方式对其中一个中间件进行测试。

```js
var should = require('should');
var mocksHttp = require('node-mocks-http');
var usersMiddlewares = require('../routes/users').middlewares;

describe('Users endpoint', function () {
  describe('getUserById middleware', function () {
    it('should have users object attached to request object', function (done) {
      var request = mocksHttp.createRequest({
        params: { id: 1 }
      });
      var response = mocksHttp.createResponse();
      usersMiddlewares.getUserById(request, response, function (err) {
        if (err) done(err);
        should.exist(request.user);
        request.user.should.have.properties(['id', 'name', 'position']);
        done();
      });
    })
  });

  // test other middlewares
  // ...
});
```

接下来用mocha运行测试

```
$ mocha tests/users.js

  Users endpoint
    getUserById middleware
      ✓ should have users object attached to request object


  1 passing (17ms)
```

你可以在项目目录下运行下面的命令让所有文件和上面所做的变更同步。

```
$ git checkout step3
```

但是现在存在一些问题。

**如果`next`函数没有被执行怎么办？**就如`responseUserWithProjects`这个中间件一样，它是没有调用`next`函数的，那么回调函数里的逻辑自然也就不会被触发。所以，这个函数的“出口”也就不唯一了。为了让测试准确，我们必须让其出口是唯一的。

### Step 4：单一“出口” - Promise

我们尝试将`getUserById`中间件改写成返回一个Promise的形式。

```js
var Promise = require('bluebird');

// ...

getUserById: function (req, res, next) {
  var userId = parseInt(req.params.id, 10);
  var userPromise = User.getUserById(userId);
  req.user = userPromise;
  next();
}
```

这里我们将`req.user`变成了一个会resolve（产生）一个user对象的Promise。那么在`getProjectsForUser`中，我们使用`req.user`的方式就会发生变化，同时，我们也让`req.project`变成一个Promise。

```js
getProjectsForUser: function (req, res, next) {
  var projectsPromise = req.user.then(function (user) {
    return User.getUserProjects(user);
  }, next);
  req.projects = projectsPromise;
  next();
}
```

对最后一个中间件`responseUserWithProjects`，也做相应的改动

```js
responseUserWithProjects: function (req, res, next) {
  Promise.all([
    req.user,
    req.projects
  ]).then(function (results) {
    var user = results[0];
    user.projects = results[1];
    res.json(user);
  }, next);
}
```

在这里，我们在中间件运行的过程中通过Promise来传递我们想要获取并传递的对象。这样做的好处在于，现在我们保证了`next`函数一定会被运行。整个中间件的“出口”是单一的。

```js
it('should have users object attached to request object', function (done) {
  var request = mocksHttp.createRequest({
    params: { id: 1 }
  });
  var response = mocksHttp.createResponse();
  usersMiddlewares.getUserById(request, response, function (err) {
    if (err) done(err);
    request.user.then(function (user) {
      user.should.have.properties(['id', 'name', 'position']);
      done();
    }, done);
  });
})
```

你可以在项目目录下运行下面的命令让所有文件和上面所做的变更同步。

```js
$ git checkout step4
```

### Step 5：对于不调用`next`的中间件

对于不调用`next`的中间件，例如`responseUserWithProjects`，我们可以直接将这个Promise当做中间件函数的返回值返回。

```js
responseUserWithProjects: function (req, res, next) {
  return Promise.all([
    req.user,
    req.projects
  ]).then(function (results) {
    var user = results[0];
    user.projects = results[1];
    res.json(user);
  }, next);
}
```

这样在测试的时候，我们只需要接着这个Promise往下`then`我们的测试逻辑即可。在测试逻辑运行前，对`res`的操作是已经结束了的，所以我们就可以直接对`res`对象进行断言了。

另外，有了Promise，我们也可以让`req.user`和`req.projects`的注入变得异常简单。我们可以使用`Promise.resove`将测试数据包装成一个会立即resolve的Promise。

```js
describe('responseUserWithProjects middleware', function () {
  it('should have user with projects object\'s JSON attached in response', function (done) {
    var request = mocksHttp.createRequest();
    var response = mocksHttp.createResponse();
    request.user = Promise.resolve({"type":"User","id":1,"name":"John Wu","position":"Software Engineer","_id":"UUTpdPICsQSLS5zp"});
    request.projects = Promise.resolve([{"type":"Project","user_id":1,"id":3,"title":"InterU","_id":"QH8MxJKnAsHSwA5X"},
      {"type":"Project","user_id":1,"id":1,"title":"Midway","_id":"UnNJxQ7eopLlWFY1"},
      {"type":"Project","user_id":1,"id":2,"title":"Esther","_id":"gZe3sgOsKxxCXHBA"}
    ]);
    usersMiddlewares.responseUserWithProjects(request, response)
      .then(function () {
        var data = JSON.parse(response._getData());
        data.should.have.properties(['id', 'name', 'position', 'projects']);
        data.projects.should.be.an.instanceOf(Array);
        data.projects.should.have.length(3);
        done();
      }, done)
  });
});
```

你可以在项目目录下运行下面的命令让所有文件和上面所做的变更同步。

```js
$ git checkout step5
```

### 总结

在这样的测试方法中，Promise本身起到了对象的“Placeholder”的作用。其本身一旦创建后就可以被使用，传递给下一个中间件，而不需要创建出回调函数，使得中间件的“出口”变成了多个。

使用Promise同时还允许我们将逻辑变成对象到处传递，我们可以随时将它们抽取出来测试。可见，使用Promise可远远不是让我们摆脱[Callback Hell](www.infoq.com/cn/articles/nodejs-callback-hell)那么简单。

另外，单元测试要求我们要能够准确地

- 描述一个功能单元的输入
- 描述一个功能单元的输出

通过这个特点，单元测试就能让我们在设计测试阶段就很好地约束每个函数（或者类方法）对应的功能（或者说scope），让我们更容易写出符合**单一职责原则**的代码。
