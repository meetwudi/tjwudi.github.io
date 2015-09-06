title: 以Node应用为例谈如何管理Web应用的环境常量
category: Engineering
thumbnailImage: dev-stage-prod.png
date: 2015-09-04 00:33:51
---


在程序员自己的小世界里，我们一直在和“量”打交道——变量和常量。可是常量真的是一成不变的吗？事实上，常量也分为两种，应用常量（application-specific constant）和环境常量（environment-specific constant）。

<!-- more -->

所谓应用常量就是，无论这个应用程序运行在哪里，这个值都是不会变的。例如，对于一个用户模块，用户名的最大长度一直都为25，那么我就可以在配置文件中直接写下这个常量。下面以JavaScript为例：

```js
const USERNAME_LENGTH_MAX = 25
```

而所谓环境常量，就是**根据这个应用程序所运行的位置的不同而产生变化，但是在运行期间都不会变化的值**。

举个例子，经典的开发流程有一种是“开发（devlopment）-预发布（staging）-线上（production）”。在这三种环境下，应用程序所使用的数据库一般都是不同的，所以使用的数据库配置也不同。

{% asset_img dev-stage-prod.png 开发-预发布-线上的开发流程 %}

如果还使用前面的方式来管理这些值的话，那么就相当地麻烦了。那么如何解决这个问题呢？答案跟应用规模有关。

### 小型应用：使用环境变量

可千万别因为一会儿常量一会儿变量而头疼，待会儿我相信你会清楚的：）

环境变量指的是，在一个机器（环境）中每个应用程序都能访问到的那些变量。举个例子，很多人都有配置Windows或者Linux系统的PATH的经历，PATH就是一个环境变量，在任何应用程序中都可以访问。我们来做一个小实验：

在任意目录下新建一个**print-path.js**

```
// process.env是Node.js运行的时候创建的一个对象
// 里面包含的是它所在的环境中所定义的环境变量
console.log(process.env.PATH)
```

然后运行它

```
$ node print-path.js
```

你就会得到类似像下面所示的字符串

```
/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Users/John/.npm-modules/bin/:/usr/local/bin/depot_tools:/usr/local/Cellar/postgresql/9.4.4/bin
```

正如在Windows下面定义PATH一样，你也可以随意定制自己的环境变量。例如在Linux/Mac OSX环境下，在终端中我们可以用**export 环境变量名=环境变量值**的方法来定义一个环境变量

```js
> $ export NAME=Esther
> $ node -e "console.log(process.env.NAME)"
> Esther
```

在第一行中，我们首先用`export`创建了一个环境变量，名称是`NAME`，值是`Esther`。在第二行中，我们用`node -e`直接运行一段Node.js程序，要求打印出`process.env.NAME`。第三行是输出的结果，我们可以看到它正确地输出了`Esther`。

> 小知识：我们一般都是用专门的文件来定义环境变量，而不是要用的时候才用`export`定义的。环境变量其实是针对shell的，我们常用的bash就是一个shell（你可以简单理解成就是Mac自带的那个终端）。使用bash的时候一般将环境变量定义在`~/.bashrc`中。对于从bash运行的程序，就可以读取其中定义的环境变量。值得一提的是，`~/.bashrc`里面也是用`export`来定义环境变量，一样一样的！

但是有的时候，在一个环境下有多个应用，特别是开发环境的机器（也就是我们码农的机器）。所以，如果将所有环境变量都定义在一块，难免很不方便，容易形成下面这样混乱的**bashrc**文件。

```bash
export APP1_NAME=weibo
export APP1_DB_NAME=weibo-zhalang
export APP2_NAME=twitter
export APP2_DB_HOST=twitter-prod-db.db.com
# ...
```

所以，我们需要更加好的方法来解决！

### 使用dotenv

dotenv实际上是一个文件，文件名是`.env`，一般被我们放在项目的根目录下。例如，下面是一个我自己的项目里面的dotenv文件

```
# 数据库配置
DB_DIALECT=postgres
DB_HOST=10.10.10.10
DB_PASSWORD=db
DB_USER=db
DB_PORT=5432
DB_NAME=webcraft
DB_CHARSET=utf8

# Node环境配置
NODE_ENV=development
```

利用dotenv，我们就可以定义针对项目的环境变量了。如果dotenv的位置是**/path/to/project/.env**，那么所有在**/path/to/project**目录下运行的文件，其能访问到的环境变量**/path/to/project/.env**定义的环境变量。

说起来有点抽象，我们来动手操作理解一下这个过程。在终端中，我们进行下面的操作

```
$ mkdir ~/test && cd $_
$ echo 'PATH=rats' > .env
$ npm install dotenv
```

上面所做的事情其实就是新建目录`~/test`并进入，然后新建一个`.env`文件。文件内容很简单：

```
NAME=Lee
```

这相当于为在这个目录下面运行的所有应用程序重新定义环境变量`PATH`的值为`rats`。当然，我们还需要一些库的支持，这个库就叫[dotenv](https://github.com/motdotla/dotenv)。（这里是Node.js版本的，其他语言基本也有自己的dotenv实现，例如php和python）。所以在上面我们用npm安装了这个库。

接下来新建**print-name.js**

```
// 加载dotenv模块
// 具体用法可以查看文档
require('dotenv').load()
console.log(process.env.NAME)
```

运行后就能看到输出为`Lee`。

这样做的好处就很明显，在不同的项目目录下应用不同的环境变量，并且它们之间不会互相干扰。

> 小挑战：你可能想问，dotenv定义的环境变量可以覆盖bash的环境变量吗？请自己尝试，看看能不能覆盖bash中的PATH变量。

这些环境变量其实对于这个项目而言就是环境常量。所以，环境常量是对于应用而言的，而环境变量是对于环境而言的。

[dotenv](https://github.com/motdotla/dotenv)

### .env-example

每个人的开发机器都不同，就算是同一个项目，所需环境变量也不同。我的数据库地址可能是A，你的则可能是B。因此，每个人的`.env`都会不同。那么，如何对`.env`进行源码管理呢？

答案就是，我们为每个人提供一个`.env`的模板，名字一般是`.env-example`。当我们将项目clone到本地后，将其复制成`.env`，然后填上我们自己需要的环境变量。

如果这样做，那么就应该将`.env`排除在源码管理之外，因为我们不希望它被分享出去。如果使用git作为源码管理工具的话，那么我们就需要在`.gitignore`中指明忽略`.env`

```
# Ignore .env file
.env
```

可以参考[我的这个项目的做法](https://github.com/tjwudi/webcraft)

### 中大型项目：将环境常量仓库式集中管理

中大型项目中要配置的环境常量可能很多，或许会接近两三千哥，不再适合用dotenv管理。

解决的方法只有一个——把它们从代码中独立出来管理。例如，我们用yaml文件定义环境常量，全部放在源码`config/env`下，其目录结构大致如下。

```
.
├── application-setting.yaml
├── database.yaml
├── dinner.yaml
├── user.yaml
└── 此处省略N个yaml文件
```

放在源码中的配置文件是给开发环境用的。对于其他环境，例如stage和production，我们可以将它们放在统一的代码仓库下面进行管理。由于配置文件的修改一般都不会是大改，所以我们可以手工维护其一致性，只要保证有类似Code Review或者一些简单的自动化检查的环节来保障就可以保持其有效。

在部署的时候，我们也可以单独部署。在这个过程中，可能需要由我们自己开发部署的工具，或者可以采用一些持续集成平台来进行部署。

综上，不同的大型项目业务环境有不同的选择，但是我认为，对于这些环境常量应该保持两条原则：

1. 集中式仓库管理，独立作为一个子系统运作
2. 自动化，这已经是很简单的场景了，完全依靠自动化排错不是问题

### 写在最后

所谓架构就是对应用程序的一系列选择。做好每一个小的选择，都是对架构的改进。良好的环境常量管理可以让配置流程更加清晰易懂，简单高效。