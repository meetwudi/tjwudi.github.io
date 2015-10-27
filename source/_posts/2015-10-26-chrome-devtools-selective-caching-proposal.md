title: 关于实现Chrome DevTools选择性Cache的提议
date: 2015-10-26 22:56:16
category: Engineering
---

我们都爱Chrome DevTools！作为Web工程师，我们每天都使用DevTools。

<!-- more -->

在使用DevTools的过程中，我们会使用“Disable Cache (while DevTools is opened)”这个功能。在开发环境中，这个功能让我们在打开DevTools的时候，每次刷新都能获取到最新版本的静态资源。

但是这个功能的弊端就是，当我们的页面在有过多静态资源的时候，就需要等非常之久。为了解决这个问题，我提出了选择性Cache的提议，可以在[这个Google Docs](https://docs.google.com/document/d/19dkHl9fRbO_bN-jH_OSkbsNtq4MT4c2ZL8cqX7llY0U/edit#heading=h.3x8nyq2w3lbm)上面看到。

希望大家可以加入这里的讨论，让我们一起让DevTools变得更好！：）