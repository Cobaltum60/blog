---
title: Python 代码框测试
date: 2026-10-29
tags: [编程]
summary: 简单测试一下博客的 Python 代码高亮
---

### 这是一篇极简的测试文章

下面是测试用例Python代码（素数判断）

```python
import math

n = int(input("请输入一个整数："))

if n < 2:
    print(f"{n} 不是素数")
else:
    is_prime = True
    for i in range(2, math.isqrt(n) + 1):
        if n % i == 0:
            is_prime = False
            break
    if is_prime:
        print(f"{n} 是素数")
    else:
        print(f"{n} 不是素数")
```