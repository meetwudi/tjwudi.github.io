title: "Don't Make Pub/Sub a Code Smell"
date: 2016-10-06 22:13:36
category: Engineering
---

Pub/Sub pattern is an event-driven approach to design software systems. Many programming languages allow engineers to leverage the power of Pub/Sub pattern. Using Pub/Sub pattern in a right way could decouple different components better. But there is still a change that Pub/Sub pattern could turn into code smell.

<!-- more -->

### Refresher on Pub/Sub

Just to give you a refresher on what Pub/Sub pattern is, here is an implementation using jQuery.

```js
var body$ = $(document.body);
body$.on('click', function clickHandler () {
  console.log('DO NOT TOUCH ME');
});
```

Whenever the page is clicked, a *click* event will be fired. The event handler `clickHandler` will be called, hence the log gets printed to console.

Here `body$` serves as publisher, who publishes event when something happens. Our code is subscriber, who subscribes to those events, receive event data, and react.

This seems so far so good. But when working on some event-heavy code like JavaScript, we could sometimes create code smell by using Pub/Sub pattern.

### Listening on local variable

### Event naming


