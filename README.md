# MD JUEJIN

掘金搬家工具，一键搬走自己的所有文章（注意这里 MD 不是“妈的”，而是“markdown”）。

本质上是一个基于 Node.js 的命令行工具，可以快速将单篇文章或用户的文章列表批量导出 md 文件，包含所有图片。

## 演示

使用命令行工具，快速批量导出：

![](https://github.com/user-attachments/assets/e97ebc3f-75ee-44ed-9971-e1d97d4b446e)

导出结果，每篇文章导出为独立的文件夹，包含 md 文件和图片：

![](https://github.com/user-attachments/assets/31d06267-9d2c-421f-adf4-d712be15e623)

## 环境要求

- Latest version of Node.js 18, 20 or 22.
- Windows 10+, Windows Server 2016+ or Windows Subsystem for Linux (WSL).
- macOS 13 Ventura, or later.
- Debian 12, Ubuntu 22.04, Ubuntu 24.04, on x86-64 and arm64 architecture.

## 使用

无需安装，即可使用。

首次使用时，安装过程中将会自动安装 playwright 和 chromium，可能需要几分钟时间。

### 单篇文章导出

```bash
# Using npx
npx md-juejin@latest post <article-url>

# Using pnpx
pnpx md-juejin@latest post <article-url>
```

article-url：掘金文章的 URL，例如：https://juejin.cn/post/7482692656990470196

### 批量导出

```bash
# Using npx
npx md-juejin@latest posts <posts-url>

# Using pnpx
pnpx md-juejin@latest posts <posts-url>
```

posts-url：掘金用户的文章列表的 URL，例如：https://juejin.cn/user/2559318798640807/posts

### 本地开发

```bash
pnpm install
pnpm dev post <article-url>
pnpm dev posts <posts-url>
```

## License

MIT
