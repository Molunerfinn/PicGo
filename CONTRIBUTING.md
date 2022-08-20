## 贡献指南

### 安装与启动

1. 使用 [yarn](https://yarnpkg.com/) 安装依赖

```bash
yarn install
```

然后通过

```bash
yarn dev
```

启动项目。

2. 只跟 Electron 主进程相关的代码请在 `src/main` 目录下添加。只跟渲染进程相关的代码请在 `src/renderer` 目录下添加。两个进程都能使用的代码请在 `src/universal` 目录下添加。 **注意**：渲染进程没有 `Node.js` 能力，所有渲染进程需要用到 `Node.js` 模块相关的代码请在 `src/main/events/picgoCoreIPC.ts` 下添加事件进行处理。

3. 所有的跨进程事件名请在 `src/universal/events/constants.ts` 里添加。

4. 所有的全局类型定义请在 `src/universal/types/` 里添加，如果是 `enum`，请在 `src/universal/types/enum.ts` 里添加。


### i18n

在 `public/i18n/` 下面创建一种语言的 `yml` 文件，例如 `zh-Hans.yml`。然后参考 `zh-CN.yml` 或者 `en.yml` 编写语言文件。并注意，PicGo 会通过语言文件中的 `LANG_DISPLAY_LABEL` 向用户展示该语言的名称。

### 提交代码

1. 请检查代码没有多余的注释、`console.log` 等调试代码。
2. 提交代码前，请执行命令 `git add . && yarn cz`，唤起 PicGo 的[代码提交规范工具](https://github.com/PicGo/bump-version)。通过该工具提交代码。
