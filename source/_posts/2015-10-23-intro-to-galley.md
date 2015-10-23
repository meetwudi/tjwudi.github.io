title: Galley - 为基于Docker架构本地开发与测试提速
date: 2015-10-23 00:40:01
category: DevOps
---

（本文投稿于[InfoQ](www.infoq.com/cn/)，无论其是否刊登，其他第三方转载请务必注明出处）

现如今，Docker已经成为了很多公司部署应用、服务的首选方案。依靠容器技术，我们能在不同的体系结构之上轻松部署几乎任何种类的应用。在洛杉矶时间2015年10月21日于旧金山展开的Twitter Flight开发者大会上，来自Fabric的工程师Joan Smith再次谈到了这一点。

<!-- more -->

她提到，尽管我们在部署应用的时候将容器技术应用得淋漓尽致，但是在开发和测试的时候还是面临着很多问题。在从前，她所在的团队的本地开发方案是用Vagrant和Chef来支撑的。Vagrant是基于虚拟机的一套本地开发方案，而Chef是一套IT架构自动化部署方案。

Joan认为，使用类似Vagrant、Chef的方案来部署本地开发方案会很浪费开发时间（Engineering Time）。她的理由主要有三点。

第一：微服务盛行。这一趋势的直接影响之一就是，每个服务自身的配置会不断变动，互相之间的依赖关系也会不断变动。今天的一个服务，明天就可能被拆分成三个服务。那么，如果你要在本地启动开发环境，那么你就需要知道所有服务之间架构的信息才能够让应用在本地跑起来。

然而大部分时候，我们在开发一个服务的时候是不需要知道整个架构的。例如，当我们在测试下图中www和www-db之间的一些功能的时候，我们其实根本可以不用关心crash service是怎么样的。

{% asset_img 1.png 整个应用的架构可以是很复杂的 %}

所以，更多时候在微服务的世界里，我们只关心我们应该关心的部分。对于不关心的部分，例如crash service，我们有一种方案就是可以用Mock来代替它。

{% asset_img 2.png 我们真正关心的部分只是其中一部分 %}


第二：Chef之类的架构自动化部署方案是叠加式（additive）的。往你的现有架构上面加东西很容易，但是想要拿掉一些东西的时候就很困难。

第三：在持续集成的环境中，Vagrant不具备可扩展性（Vagrant on CI just doesn’t scale）。由于Vagrant是基于虚拟机的，在运行过一次CI上的Pipeline任务之后，虚拟机就会被污染（polluted），无法用于下一次的任务执行。

基于对现有本地开发普遍方案的这些问题，Joan提出了她的看法：我们为什么不利用好Docker这个平台，让它在本地开发、测试的时候也能跟线上保持一致呢？但是如果直接用Docker命令行来启动应用，手动管理依赖，那么时间成本也很大。Docker Compose确实能够胜任一次性启动多个容器的任务，但是它依然不够灵活。

随后，Joan介绍了Galley，一个为本地开发、测试而设计的组合并协调（orchestrating）Docker容器的命令行工具。

她还风趣地提到，Vagrant的意思漂泊的，Chef的意思是厨师，而Galley的意思就是漂泊的厨师（原意是船上的厨房）。

Galley最大的优点就是能让工程师在本地基于自己的代码构建镜像并运行，这些本地构建的代码是他们当前在完成的特性所关心的部分；而对于他们不关心的部分，例如上面提到的crash service，Galley则自动改用Docker Hub（或者私有的Hub）中已经构建好了的镜像来直接运行。

Galley采用一个集中的Galleyfile描述整个应用的架构。Galleyfile是一个JavaScript文件，它的module.exports对象即为你所有服务容器的描述。例如下面就是一个合法的Galleyfile的例子。

```js
module.exports = {
  CONFIG: {
    registry: 'docker-registry.your-biz.com'
  },

  'config-files': {},
  'beanstalk': {},

  'www-mysql': {
    image: 'mysql',
    stateful: true
  },

  'www': {
    env: {
      RAILS_ENV: {
       'dev': 'development',
       'test': 'test'
      }
    },
    links: {
      'dev': ['www-mysql:mysql', 'beanstalk'],
      'test': ['www-mysql']
    },
    ports: {
      'dev': ['3000:3000']
    },
    source: '/code/www',
    volumesFrom: ['config-files']
  }
};
```

在上面，我们定义了所有容器来源的Registry。一般情况下，这会是你自己公司内部的私有Registry。另外，我们还定义了四个容器config-files、beanstalk、www-mysql和www。这四个容器都是在上面指定的Registry可以下载到的。

假设www容器是我们正在开发的服务，那么我们一般会用”galley run www.dev --rsync -s .” 命令启动www容器，并且是在dev环境。在Galley里有两个环境，一个是dev，一个是test。这时候Galley会为我们做几件事情：

将source属性指定的文件夹（在容器内）和当前galley run指定的目录同步。Galley的支持使用rsync将源码拷贝到Docker所在的机器中。这对于在Mac下开发的人们来说是个很好的特性，因为Docker的volume支持默认采用VirtualBox的Shared Folder功能，而这一功能的效率很低。
links属性中的dev属性指明了在dev环境下www应用的依赖项。Galley会为我们将这些依赖的容器全部pull到本地并且启动，并自动和www链接在一起。在这里，Galley就会pull并link两个容器，一个是www-mysql:mysql，一个是beanstalk。对于在volumesFrom（对应Docker的volumes-from）指定的容器，Galley也会自动pull并部署。
应用环境变量。在这里，www是一个小型Rails应用，于是我们可以应用一些Rails应用的环境变量。
进行端口映射

更完整的配置方法可以参考[Galley的官方文档](https://github.com/twitter-fabric/galley#rsync-support)。

我们可以注意到，在第二点中，Galley只会帮我们获取我们当前开发所关心的服务，其他不相关的服务，Galley不会获取并部署它们。

默认情况下，galley run每次都会重新创建我们当前正在开发的应用的容器。对于依赖项，在满足一定条件的时候也会重新创建（见文档）。我们注意到www-mysql容器是stateful（有状态的）的，因为它是一个数据库容器。对于stateful的容器，Galley不会自动重新创建它们，保证开发用的数据不会因为重新创建容器而丢失。

Galley另外一点很有趣的地方是可以创建附加项（Addons）。所谓附加项就是允许开发者通过命令行来手动指定一些容器的行为。这样说很抽象，我们来看一个例子。下面是一段Addons的配置。

```js
module.exports = {
  …
  ADDONS: {
    'beta': {
      'www': {
        env: {
          'USE_BETA_SERVICE': '1'
        },
        links: ['beta', 'uploader']
      },
      'uploader': {
        env: {
          'USE_BETA_SERVICE': '1'
        }
      }
    }
  }
  …
};
```

在用galley run运行的时候，加入-a beta参数，那么在ADDONS.beta对象里面的所有配置也会被应用。例如，在这里www服务就被应用了额外的环境变量USE_BETA_SERVICE，而且还应用了额外的link containers。

聪明的读者可以猜猜，USE_BETA_SERVICE这个环境变量的作用是什么？启动Mock模式！在前面我们提到，很多时候我们可以使用Mock的方式来模拟一个正常运作的服务（一般是依赖项），从而我们最多只需要关注直接依赖项，而不需要关注依赖项的依赖项。当然了，从笔者本人的角度来看，Mock这种方法并不是银弹。即便如此，在一些情景下它也能缩小我们所要关心的范围。

基于Vagrant开发的又一问题是，Docker的Vagrant配置是Hostonly网络，也就是说你没有办法直接从除了你自己本地机器外其他的地方很容易地连接到你的Docker容器。对此，Galley的进程还启动了TCP Proxy，将发往本地机器端口的流量代理到Docker的Vagrant虚拟机，这样即便你是在调试手机应用，也可以轻松、直接地访问到自己的机器了。

最后Joan还展示了Fabric团队自身使用Galley进行开发的示例，可以看到Galley确实在一定程序上极大地简化了Fabric团队本地开发和测试的工作流。

建议感兴趣的读者可以自己使用Galley体验一下，感受它所带来的方便和潜在的痛点。如果它确实在你自己的应用体系中能够很完美地胜任协调本地开发、测试的容器依赖协调工作的话，那么何乐而不为呢？

