---
title: C 语言判断奇偶
date: 2026-10-26
tags: [C语言, 算法]
summary: 使用 C 语言实现奇偶数的判断
---

在 C 语言入门阶段，学习的奇偶判断是了解if else结构的好方法

## 简单方法：使用取模运算符 `%`

这是最直观的方法。如果一个整数除以 2 的余数为 0，那么它就是偶数；否则就是奇数。

```c
#include <stdio.h>

int main() {
    int num;
    printf("请输入一个整数: ");
    scanf("%d", &num);

    if (num % 2 == 0) {
        printf("%d 是偶数。\n", num);
    } else {
        printf("%d 是奇数。\n", num);
    }

    return 0;
}