---
title: C 语言 switch 语句的基础与深度剖析
date: 2026-10-26
tags: [编程]
summary: 彻底掌握 C 语言 switch 的基础语法、fall-through（穿透）机制以及最常见的避坑指南。
---

## 前言

当代码中出现多个分支判断时，大量的 `if-else` 会让代码变得难以阅读。`switch` 语句应运而生，它让多分支逻辑变得清晰。但很多人在使用时，只停留在表面，不了解它的基础规则。

本文带你从基础语法出发，深入理解 `switch` 的执行逻辑。

## 一、 switch 的基础骨架

标准的 `switch` 语句结构如下：

```c
switch (expression) {
    case constant1:
        // 执行代码
        break;
    case constant2:
        // 执行代码
        break;
    default:
        // 所有 case 都不匹配时执行
        break;
}
```

**核心规则：**
1. `expression` 的结果**必须是整型**（包括 `int`、`char`、`short`、`long`）。
2. `case` 后面跟的**必须是常量表达式**，不能是变量。例如 `case a:`（a 是变量）会直接导致编译报错。
3. 多个 `case` 后面的常量值不能重复。

## 二、 最容易踩的坑：Fall-through（穿透）

这是 `switch` 最独特、也最容易引发 Bug 的机制。

**在 `switch` 中，`case` 仅仅是一个“入口标签”，并不是独立的作用域或代码块。**

当某个 `case` 匹配成功后，程序会从那个标签开始，一直往下执行，**除非遇到 `break;`**。

### 灾难现场
```c
int level = 1;
switch (level) {
    case 1:
        printf("青铜\n");
        // 忘记写 break 了！
    case 2:
        printf("白银\n");
    case 3:
        printf("黄金\n");
        break;
}
```
**输出结果：**
```text
青铜
白银
黄金
```
因为 `level` 匹配了 `case 1`，打印了“青铜”后没有 `break` 拦截，程序顺势“穿透”到了 `case 2` 和 `case 3`。

## 三、 成绩等级实例分析：巧妙利用穿透

理解了穿透原理，我们来看一个极其经典的实战案例：**根据分数划分成绩等级**。

如果不使用 `switch`，用 `if-else` 写大概是这样的：
```c
int score = 85;
if (score >= 90 && score <= 100) {
    printf("优秀\n");
} else if (score >= 80 && score < 90) {
    printf("良好\n");
} else if (score >= 60 && score < 80) {
    printf("及格\n");
} else {
    printf("不及格\n");
}
```

这种写法没问题，但如果分支再多一点，代码就会极度冗长。我们来用 `switch` 配合**整除（/10）**和**故意穿透**进行改造：

```c
#include <stdio.h>

int main() {
    int score;
    printf("请输入成绩(0-100): ");
    scanf("%d", &score);

    // 先过滤非法分数
    if (score < 0 || score > 100) {
        printf("成绩输入有误！\n");
        return 1;
    }

    // 利用 score / 10 将 100 个可能的分数压缩到 10 个区间
    switch (score / 10) {
        case 10: // 满分 100
        case 9:  // 90-99
            printf("等级: 优秀\n");
            break;
        case 8:  // 80-89
            printf("等级: 良好\n");
            break;
        case 7:  // 70-79
        case 6:  // 60-69
            printf("等级: 及格\n");
            break;
        default: // 0-59
            printf("等级: 不及格\n");
            break;
    }

    return 0;
}
```

### 为什么这样写极其优雅？
1. **巧妙利用整除**：无论输入的是 95 还是 99，`score / 10` 的结果都是 `9`。这样我们就用一行代码，把 10 个具体的数字压缩成了一个分支条件，完美契合 `switch` 的特性。
2. **艺术级的穿透**：在 `case 9` 和 `case 10` 中，我们故意不写 `break`。当分数是 100 时，匹配到 `case 10`，直接穿透执行到 `case 9` 的 `printf`，然后遇到 `break` 结束。这极大精简了代码。

### ⚠️ 这个案例的隐藏边界测试
仔细思考一下，如果输入 `score = 100`，`100 / 10` 的结果是 `10`。
如果此时我们只写了 `case 9:` 而没写 `case 10:`，会发生什么？
（答案：会直接掉进 `default` 里，输出“不及格”，这是一个极度致命的逻辑 Bug。）

所以，使用 `switch` 做区间映射时，**必须穷举所有可能的情况**，或者用 `default` 兜底，千万不能想当然。

## 四、 深度剖析：case 中的变量作用域

很多初学者会在 `case` 里直接定义变量，比如：

```c
switch (x) {
    case 1:
        int a = 10; // 编译报错！
        printf("%d", a);
        break;
    case 2:
        int b = 20;
        break;
}
```

**为什么会报错？**
因为整个 `switch` 的花括号 `{}` 才是一个完整的块级作用域。所有的 `case` 都共享这个作用域。如果你在 `case 1` 里定义了变量 `a`，在 `case 2` 里又定义了同名变量 `a`，就会发生重定义冲突。而且，如果程序跳过了 `case 1` 直接进入 `case 2`，变量 `a` 的初始化过程就被跳过了，这在 C 语言中是不被允许的。

**正确做法：给需要定义变量的 `case` 加上独立的花括号。**
```c
switch (x) {
    case 1: {
        int a = 10; // 正确，限制在局部作用域内
        printf("%d", a);
        break;
    }
    case 2:
        // ...
        break;
}
```

## 五、 总结

`switch` 是一门“看起来简单，写起来容易错”的语法。
**记住两点：**
1. 写完 `case`，时刻检查 `break;`，除非你是故意想利用穿透特性。
2. 在 `case` 里写变量声明，一定要加上独立的 `{}` 块。
