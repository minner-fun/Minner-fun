# Assembly


这段 `assembly`（内联汇编）正是 Solidity 底层操作的经典例子。
我们来一步步拆开你问的两个核心点：

---

## 一、`mstore` 是什么？

`mstore` 是 EVM（以太坊虚拟机）的底层指令之一，全称是 **“memory store”**。
作用：**往内存（memory）某个位置写入 32 字节数据**。

语法：

```assembly
mstore(<memoryOffset>, <value>)
```

* `memoryOffset`：内存地址（以字节为单位）；
* `value`：要写入的内容；
* `mstore` 一次写入 **32 字节 (256 bit)**。

---

### 结合你的例子解释：

```solidity
mstore(0x00, "\x19Ethereum Signed Message:\n32")
```

→ 把字符串 `"\x19Ethereum Signed Message:\n32"` 写到内存起始位置 `0x00`。
这就是以太坊签名规范的前缀。

接着：

```solidity
mstore(0x1c, messageHash)
```

→ 从内存偏移 `0x1c`（即 28 字节处）开始，再写入一个 32 字节的哈希值。

所以此时内存布局如下：

```
[0x00 .. 0x1b] : "\x19Ethereum Signed Message:\n32" (28字节)
[0x1c .. 0x3b] : messageHash (32字节)
```

---

## 二、`:=` 是什么意思？

`:=` 是 **Yul（Solidity 内联汇编语言）里的赋值符号**，等价于普通 Solidity 的 `=`。

例如：

```assembly
digest := keccak256(0x00, 0x3c)
```

表示：

> 调用 `keccak256` 对内存 `[0x00, 0x3c)`（长度 0x3c = 60 字节） 进行哈希，
> 并把结果赋值给 `digest`。

也就是说：

* 前 28 字节是前缀；
* 后 32 字节是消息；
* 总共 60 字节；
* `digest` 最终就是以太坊签名格式的哈希值。

---

## 三、完整执行逻辑回顾

```solidity
assembly ("memory-safe") {
    mstore(0x00, "\x19Ethereum Signed Message:\n32")
    mstore(0x1c, messageHash)
    digest := keccak256(0x00, 0x3c)
}
```

相当于：

1. 在内存前 60 字节里写入：

   ```
   "\x19Ethereum Signed Message:\n32" + messageHash
   ```
2. 对这 60 字节做 `keccak256`；
3. 把结果存在 `digest` 变量中；
4. 返回这个哈希。

最终结果就是：

```solidity
digest = keccak256("\x19Ethereum Signed Message:\n32" ++ messageHash);
```

---

✅ **总结**

| 语法                          | 含义                               | 类似于                  |
| --------------------------- | -------------------------------- | -------------------- |
| `mstore(a, b)`              | 向内存地址 `a` 写入 32 字节 `b`           | `memory[a:a+32] = b` |
| `:=`                        | 内联汇编的赋值符号                        | `=`                  |
| `keccak256(offset, length)` | 对内存 `[offset, offset+length)` 哈希 | `keccak256(bytes)`   |

---