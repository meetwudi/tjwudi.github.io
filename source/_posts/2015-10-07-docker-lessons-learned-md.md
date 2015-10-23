title: 我从开源项目中学习到的Docker经验
date: 2015-10-07 19:42:44
category: DevOps
---

最近几周从一个Web开发俨然摇身一变成了“运维”，在GitHub上面为[re:dash](https://github.com/EverythingMe/redash)做Docker化的支持。在整个Code Review的过程中汲取了一些Docker的经验。

<!-- more -->

### 不要build

不要在构建Docker镜像的时候build。这里的build指的是将代码编译至production-ready的过程。例如，在一个Web应用中，用`make`将静态资源最小化（minify）、拼接（concatenate），以及配置文件的生成等。

{% asset_img build-process.png Build Process %}

仔细思考Docker要解决的主要问题，就是如何跨越操作系统的限制进行部署。因此构建Docker镜像的过程中，我们也只应该专注镜像本身环境的搭建，例如系统软件、python依赖项等。python的依赖项是比较特殊的，因为它们一般是安装在系统层面上的。

如果是Node.js的非全局依赖项，那么也无需在镜像中来下载安装，而是在build的过程中下载，然后直接在**Dockerfile**中`Copy`到镜像中。


### 合理地将相同的指令结合

Docker在构建镜像的过程中，每运行**Dockerfile**的一个指令，都会构建出一个*layer*。一个镜像就是由许多的*layer*叠加而成的，这样的设计允许Docker能够缓存我们镜像中特定的一些部分，之后如果对**Dockerfile**进行修改的话，一般情况下能通过缓存加快构建的效率。

```
RUN apt-get update
RUN apt-get -y install libpq-dev postgresql-client
```

上面两条`RUN`指令分别会创建两个layer。当指令数量过多的时候，layer就会多到爆了，甚至会提示你磁盘空间已经不够用了。

更好的方式是将两条相同的指令合理地合成一条。

```
RUN apt-get update && \
    apt-get -y install libpq-dev postgresql-client
```

这样构建过程中就只会产生一个layer，减少磁盘空间的消耗。

### 镜像应该各司其职

每个镜像应该各司其职，这背后的主要目的是为了可扩展性考虑。

如果你有一个这样的镜像……

{% asset_img all-in-one-container.png all-in-one container %}

那么你可能觉得很方便！的确，你只要简单地`docker run`一下就可以结束工作，到一旁喝咖啡了。

但是当你的应用需要扩展（scale）的时候，你可能就要抓耳挠腮了。将所有的东西通通放在一个容器里面，你就没有办法做横向的扩展。

横向扩展，也称作**X-axis scaling**，主要通过复制现有的服务来提高该服务的可用性、并通过负载均衡将请求分散给该服务的诸多“复制品”，提供服务的速率等。横向扩展是3D扩展模型（# Dimensions to Scaling）中的一种。

{% asset_img 3d-scale-model.jpg 3D扩展模型 %}

其中，横向扩展（X-axis scaling）通过复制的方式。纵向扩展（Y-axis scaling）通过将应用功能分解，每个服务运行的代码都不同。最后一个Z-axis scaling通过将数据划分成多块，并由多个服务使用。每个服务上运行的代码是一致的，而所负责的数据分区则不同。如果你感兴趣，可以看[The Scale Cube](http://microservices.io/articles/scalecube.html)这篇文章（上面的图片出于此）。

如果一个镜像中同时打包了一个Web应用、postgres和nginx三个不同的服务，那么我们就无法单独地对Web App本身进行复制，横向扩展；也无法对单独将postgres的数据进行扩展。

相反，如果这三个服务分别被构建到不同的Docker镜像之后，我们就可以轻松地进行扩展了。在这之中，可以应用[Docker Compose](https://docs.docker.com/compose/)轻松启动一系列的镜像，并将它们互相连接在一起。
