title: Debugging with strace
date: 2015-11-27 00:32:56
category: Tools
---

[strace](http://linux.die.net/man/1/strace) is a tool that helps to inspect system calls your application makes. I found it really useful this week when I debugging a complex python application. I am not going through my original problem though, but will show you some typical examples as proof of concept.

<!-- more -->

Let's start with a basic scenario, file I/O on local filesystem. Suppose we have a powerful python script **traceme.py**, whilst there isn't a **a.txt**.

```
# traceme.py
with open('a.txt') as f:
    f.readline()
```

If we run it, not surprisingly you are getting `IOError`.

```
Traceback (most recent call last):
File "strace_me.py", line 1, in <module>
  with open('a.txt') as f:
  IOError: [Errno 2] No such file or directory: 'a.txt'
```

But let's say for some reason, sometimes we don't get the name of the missing file. That was what happened to me earlier this week, and I got so confusing just because I didn't know what was missing out there.

I then ended up using **strace**, trying to find out what system call my program made. The simplies use case of **strace** is barely prepending command `strace` to the command you want to debug.

```
$ strace python traceme.py
```

A bunch of blazing long message will be shown like following.

```
...
mmap(NULL, 4096, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f6f772e9000
lseek(3, 0, SEEK_CUR)                   = 0
read(3, "with open('a.txt') as f:\n    f.r"..., 4096) = 42
lseek(3, 42, SEEK_SET)                  = 42
read(3, "", 4096)                       = 0
close(3)                                = 0
munmap(0x7f6f772e9000, 4096)            = 0
open("a.txt", O_RDONLY)                 = -1 ENOENT (No such file or directory)
write(2, "Traceback (most recent call last"..., 35Traceback (most recent call last):
) = 35
write(2, "  File \"traceme.py\", line 1, in "..., 41  File "traceme.py", line 1, in <module>
) = 41
open("traceme.py", O_RDONLY)            = 3
fstat(3, {st_mode=S_IFREG|0644, st_size=42, ...}) = 0
mmap(NULL, 4096, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f6f772e9000
read(3, "with open('a.txt') as f:\n    f.r"..., 4096) = 42
write(2, "    ", 4    )                     = 4
...
```

Those are all system calls your program made at runtime. Apparently, according the the following line, we can address the name of the missing file.

```
open("a.txt", O_RDONLY)                 = -1 ENOENT (No such file or directory)
```

It also told you that this file was supposed to be opened in readonly mode. You will find many system calls interesting if you are not very familiar with kernel level programming.

You can make your life way more easier buy just tracing a specific kind of system calls. In our case, my point of interest should be `open`. Use `-e trace=<comma-separated-list-of-system-call-categories>` to designate that.

```
$ strace -e trace=open python traceme.py
```

Then hopefully we are getting a much simpler and cleaner output.

```
open("/usr/lib/python2.7/encodings/ascii.py", O_RDONLY) = 3
open("/usr/lib/python2.7/encodings/ascii.pyc", O_RDONLY) = 4
open("traceme.py", O_RDONLY)            = 3
open("traceme.py", O_RDONLY)            = 3
open("a.txt", O_RDONLY)                 = -1 ENOENT (No such file or directory)
```

You can also attach a **strace** session to a running process by setting `-p` parameter to the pid of process you are interested in. That will be super helpful when debugging your running web application.

```
root@dev:~# strace -p 15427
Process 15427 attached - interrupt to quit
futex(0x402f4900, FUTEX_WAIT, 2, NULL) 
Process 15427 detached
```

You can even do profiling to all the system calls your code made by using `-c` parameter. I personally think `c` stands for collecting. It's a really powerful tool for you to understand performance issues from a low-level ground.

```
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ----------------
100.00    0.000006           0        65           close
  0.00    0.000000           0        98           read
  0.00    0.000000           0         8           write
  0.00    0.000000           0       222       159 open
  0.00    0.000000           0        83        57 stat
  0.00    0.000000           0        95           fstat
  0.00    0.000000           0         5           lstat
  0.00    0.000000           0         3           lseek
```

You can tell from the result that `open` system call is obviously is the performance bottleneck of the powerful app we just wrote.

I use **strace** whenever I don't have enough context of what my app is doing with the operating system. You can even use it to debug internet connection by tracing `poll,select,connect,recvfrom,sendto` system calls, which is super handy :P.
