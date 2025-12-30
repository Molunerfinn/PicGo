## Frequently Asked Questions / 常见问题

> While using PicGo you may run into various issues. Many of them have already been asked and resolved, so please check the [documentation](https://picgo.github.io/PicGo-Doc/guide/getting-started.html#%E5%BF%AB%E9%80%9F%E4%B8%8A%E6%89%8B), this FAQ, and closed [issues](https://github.com/Molunerfinn/PicGo/issues?q=is%3Aissue+is%3Aclosed) first — you will likely find the answer there.
>
> 在使用 PicGo 期间你会遇到很多问题，不过很多问题其实之前就有人提问过，也被解决，所以你可以先看看 [使用文档](https://picgo.github.io/PicGo-Doc/guide/getting-started.html#%E5%BF%AB%E9%80%9F%E4%B8%8A%E6%89%8B)，这份 FAQ，以及那些被关闭的 [issues](https://github.com/Molunerfinn/PicGo/issues?q=is%3Aissue+is%3Aclosed)，应该能找到答案。

## 1. Qiniu image host: upload succeeds but images don’t show in Album, or the URL has no `http://` prefix / 七牛图床上传图片成功后，相册里无法显示或图片无`http://`前缀

This is usually because the `Set URL` (access URL) in your Qiniu image host configuration does not include the `http://` or `https://` scheme.

Reference: [issue#79](https://github.com/Molunerfinn/PicGo/issues/79)

通常是你的七牛图床配置里的`设定访问网址`没有加上`http://`或者`https//`头。

参考：[issue#79](https://github.com/Molunerfinn/PicGo/issues/79)

## 2. Can PicGo delete images on the remote image host after upload? / 能否支持图床远端同步删除

Not at the moment. Some image hosts (e.g. Weibo image host, SM.MS, Imgur, etc.) don’t provide a backend management API, so PicGo does not support remote deletion for the sake of a consistent architecture.

暂时不支持。有些图床（比如微博图床、SM.MS、Imgur 等）不支持后台管理，为了架构统一不支持远端删除。

## 3. Can PicGo upload video files? / 能否支持上传视频文件

Some image hosts support uploading video files, but not all. Please follow the capabilities of the image host (and/or the plugin) you are actually using.

目前部分图床支持上传视频文件，但并非所有图床都支持，请以实际使用的图床以及插件为准。

## 4. Weibo image host: uploaded images don’t preview / 微博图床上传之后无法显示预览图

This is usually caused by having a global proxy enabled.

Reference: [issue36](https://github.com/Molunerfinn/PicGo/issues/36)

通常是挂了全局代理导致的。

参考：[issue36](https://github.com/Molunerfinn/PicGo/issues/36)

## 5. Can you add support for an image host? / 能否支持某某某图床

As of v1.6, PicGo supports the following built-in image hosts:

- `Weibo image host` v1.0
- `Qiniu image host` v1.0
- `Tencent Cloud COS v4/v5` v1.1 & v1.5.0
- `Upyun` v1.2.0
- `GitHub` v1.5.0
- `SM.MS` v1.5.1
- `Alibaba Cloud OSS` v1.6.0
- `Imgur` v1.6.0

PicGo itself will not add support for additional third-party image hosts as built-in features. If you need other image hosts, please refer to existing third-party [plugins](https://github.com/PicGo/Awesome-PicGo). If the one you need doesn’t exist yet, you’re welcome to develop a plugin and share it with the community.

截止 v1.6，PicGo 支持了如下图床：

- `微博图床` v1.0
- `七牛图床` v1.0
- `腾讯云 COS v4\v5 版本` v1.1 & v1.5.0
- `又拍云` v1.2.0
- `GitHub` v1.5.0
- `SM.MS` v1.5.1
- `阿里云 OSS` v1.6.0
- `Imgur` v1.6.0

所以本体内将不会再支持其他第三方图床。需要其他图床支持可以参考目前已有的三方 [插件](https://github.com/PicGo/Awesome-PicGo)，如果还是没有你所需要的图床欢迎开发一个插件供大家使用。

## 6. GitHub image host uploads sometimes succeed and sometimes fail / GitHub 图床有时能上传，有时上传失败

1. The GitHub image host does not allow uploading files with the same name. If you upload a duplicate filename, you will get an error. Enable `Timestamp Rename` to avoid name collisions.
2. Due to GitHub network conditions (and the Great Firewall in mainland China), uploads may sometimes succeed and sometimes fail — there is no universal fix. For stability, consider using a paid cloud storage service such as Alibaba Cloud or Tencent Cloud; they are usually inexpensive.

1. GitHub 图床不支持上传同名文件，如果有同名文件上传，会报错。建议开启 `时间戳重命名` 避免同名文件。
2. GitHub 服务器和国内 GFW 的问题会导致有时上传成功，有时上传失败，无解。想要稳定请使用付费云存储，如阿里云、腾讯云等，价格也不会贵。

## 7. Can’t open PicGo’s main window on macOS / Mac 上无法打开 PicGo 的主窗口界面

On macOS, PicGo is a menu bar app, so it won’t show an icon in the Dock by default. To open the main window, right-click (or two-finger click) the PicGo menu bar icon and choose “Open Main Window”.

Starting from v2.4.1, PicGo lets you hide the Dock icon (`showDockIcon`) and the menu bar icon (`showMenubarIcon`) separately. If you turn both off (set both to `false`), you won’t be able to find the UI via either the Dock or the menu bar.

How to recover manually:

1. Locate and edit PicGo’s config file `data.json`.
    - If you can still open the settings page: PicGo Settings -> “Open Config File”.
    - If you can’t find the UI: the default location is usually `~/Library/Application Support/PicGo/data.json` (if you configured a custom path, follow `configPath`).
2. Set either field below to `true` (it’s recommended to keep at least one of them `true`). Do not modify other fields.
3. Save and restart PicGo.

PicGo 在 Mac 上是一个顶部栏应用，在 dock 栏是不会有图标的。要打开主窗口，请右键或者双指点按顶部栏 PicGo 图标，选择「打开详细窗口」即可打开主窗口。

从 v2.4.1 开始，PicGo 支持在 macOS 下分别隐藏 Dock 栏图标（`showDockIcon`）和顶部栏图标（`showMenubarIcon`）。如果你把这两个配置都关闭（都设为 `false`），将会导致你无法通过 Dock 或顶部栏找到 PicGo 主界面。

手动恢复方法：

1. 找到并编辑 PicGo 的配置文件 `data.json`。
    - 如果还能打开设置页：PicGo 设置 -> 「打开配置文件」。
    - 如果已经找不到界面：默认配置文件通常在 `~/Library/Application Support/PicGo/data.json`（如果你曾配置过自定义路径，则以配置里的 `configPath` 为准）。
2. 把以下任意一个字段改为 `true`（建议至少保留一个为 `true`），同时不要删改其他字段：

```json
{
   "settings": {
      // other settings ...
      "showDockIcon": true,
      "showMenubarIcon": true
   }
}
```

3. 保存后重启 PicGo。

## 8. Upload failed, or server returned an error / 上传失败，或者是服务器出错

1. PicGo’s built-in image hosts are tested; upload errors are usually not caused by PicGo itself. If you are using the GitHub image host, see FAQ #6.
2. Check PicGo logs (PicGo Settings -> Log File -> Open) and look for key information in `[PicGo Error]`.
   1. Search the error message first — you can often find the root cause via search engines without opening an issue.
   2. If you see `401`, `403`, or other `40X` status codes, it almost certainly means your configuration is wrong. Double-check for typos, trailing spaces, etc.
   3. If you see `HttpError`, `RequestError`, `socket hang up`, etc., that indicates a network issue. Please check your network, proxy, and DNS settings.
3. Upload failures caused by network issues are often due to incorrect proxy settings. If you enabled a system proxy, it’s recommended to also configure the corresponding HTTP proxy in PicGo. See [#912](https://github.com/Molunerfinn/PicGo/issues/912)

1. PicGo 自带的图床都经过测试，上传出错一般都不是 PicGo 自身的原因。如果你用的是 GitHub 图床请参考上面的第 6 点。
2. 检查 PicGo 的日志（报错日志可以在 PicGo 设置 -> 设置日志文件 -> 点击打开 后找到），看看 `[PicGo Error]` 的报错信息里有什么关键信息
   1. 先自行搜索 error 里的报错信息，往往你能百度或者谷歌出问题原因，不必开 issue。
   2. 如果有带有 `401` 、`403` 等 `40X` 状态码字样的，不用怀疑，就是你配置写错了，仔细检查配置，看看是否多了空格之类的。
   3. 如果带有 `HttpError`、`RequestError` 、 `socket hang up` 等字样的说明这是网络问题，我无法帮你解决网络问题，请检查你自己的网络，是否有代理，DNS 设置是否正常等。
3. 通常网络问题引起的上传失败都是因为代理设置不当导致的。如果开启了系统代理，建议同时也在 PicGo 的代理设置中设置对应的HTTP代理。参考 [#912](https://github.com/Molunerfinn/PicGo/issues/912)

## 9. Installed on macOS but there is no main UI window / macOS版本安装完之后没有主界面

Find the PicGo icon in the macOS menu bar, then right-click (two-finger click on trackpad) to open the menu and choose “Open Main Window”.

请找到PicGo在顶部栏的图标，然后右键（触摸板双指点按，或者鼠标右键），即可找到「打开详细窗口」的菜单。

## 10. Album suddenly can’t show images, or doesn’t refresh after upload, or Typora + PicGo upload succeeds but doesn’t write back / 相册突然无法显示图片 或者 上传后相册不更新 或者 使用Typora+PicGo上传图片成功但是没有写回Typora

This may be caused by a corrupted album database. Locate `picgo.db` under your PicGo config directory, delete it (backup first if needed), then restart PicGo.

Also check the log file for errors and open an issue if necessary. Versions >= 2.3.0 have addressed issues caused by a corrupted `picgo.db`, so upgrading is recommended.

这个原因可能是相册存储文件损坏导致的。可以找到 PicGo 配置文件所在路径下的 `picgo.db` ，将其删掉（删掉前建议备份一遍），再重启 PicGo 试试。
注意同时看看日志文件里有没有什么error，必要时可以提issue。2.3.0以上的版本已经解决因为 `picgo.db` 损坏导致的上述问题，建议更新版本。

## 11. Gitee-related issues / Gitee相关问题

If you run into upload issues with the Gitee image host, PicGo cannot help because PicGo does not provide an official Gitee uploader. Please open an issue in the repository of the Gitee plugin you are using.

如果在使用 Gitee 图床的时候遇到上传的问题，由于 PicGo 并没有官方提供 Gitee 上传服务，无法帮你解决，请去你所使用的 Gitee 插件仓库发相关的issue。

## 12. On macOS, PicGo shows “App is damaged”, or it doesn’t respond after installation / macOS系统安装完PicGo显示「文件已损坏」或者安装完打开没有反应

Because PicGo is not signed, it may be blocked by macOS Gatekeeper.

1. If you see “App is damaged” when opening after installation, do the following:

Trust the developer (password required):

```
sudo spctl --master-disable
```

Then remove quarantine attributes from PicGo:

```
xattr -cr /Applications/PicGo.app
```

If you see the following message:

```sh
option -r not recognized

usage: xattr [-slz] file [file ...]
       xattr -p [-slz] attr_name file [file ...]
       xattr -w [-sz] attr_name attr_value file [file ...]
       xattr -d [-s] attr_name file [file ...]
       xattr -c [-s] file [file ...]

The first form lists the names of all xattrs on the given file(s).
The second form (-p) prints the value of the xattr attr_name.
The third form (-w) sets the value of the xattr attr_name to attr_value.
The fourth form (-d) deletes the xattr attr_name.
The fifth form (-c) deletes (clears) all xattrs.

options:
  -h: print this help
  -s: act on symbolic links themselves rather than their targets
  -l: print long format (attr_name: attr_value)
  -z: compress or decompress (if compressed) attribute value in zip format
```

Run:

```
sudo xattr -d com.apple.quarantine /Applications/PicGo.app/
```

2. If PicGo doesn’t respond after installation, troubleshoot in this order:
   1. PicGo won’t automatically pop up a main window on macOS — it’s designed as a menu bar app. If you can see the PicGo icon in the menu bar, the installation succeeded; click it to open the menu bar window. See FAQ #7.
   2. If you’re on an Apple Silicon (M1) Mac and previously had the x64 build installed, then switched to the arm64 build and it doesn’t respond, reboot your Mac.

因为 PicGo 没有签名，所以会被 macOS 的安全检查所拦下。

1. 安装后打开遇到「文件已损坏」的情况，请按如下方式操作：

信任开发者，会要求输入密码:

```
sudo spctl --master-disable
```

然后放行 PicGo :

```
xattr -cr /Applications/PicGo.app
```

然后就能正常打开。

如果提示以下内容

```sh
option -r not recognized

usage: xattr [-slz] file [file ...]
       xattr -p [-slz] attr_name file [file ...]
       xattr -w [-sz] attr_name attr_value file [file ...]
       xattr -d [-s] attr_name file [file ...]
       xattr -c [-s] file [file ...]

The first form lists the names of all xattrs on the given file(s).
The second form (-p) prints the value of the xattr attr_name.
The third form (-w) sets the value of the xattr attr_name to attr_value.
The fourth form (-d) deletes the xattr attr_name.
The fifth form (-c) deletes (clears) all xattrs.

options:
  -h: print this help
  -s: act on symbolic links themselves rather than their targets
  -l: print long format (attr_name: attr_value)
  -z: compress or decompress (if compressed) attribute value in zip format
```
执行命令

```
sudo xattr -d com.apple.quarantine /Applications/PicGo.app/
```

2. 如果安装打开后没有反应，请按下方顺序排查：
   1. macOS安装好之后，PicGo 是不会弹出主窗口的，因为 PicGo 在 macOS 系统里设计是个顶部栏应用。注意看你顶部栏的图标，如果有 PicGo 的图标，说明安装成功了，点击图标即可打开顶部栏窗口。参考上述第七点。
   2. 如果你是 M1 的系统，此前装过 PicGo 的 x64 版本，但是后来更新了 arm64 的版本发现打开后没反应，请重启电脑即可。

## 13. Are third-party plugins claiming to be “PicGo Official image host” trustworthy? / 所谓「PicGo 官方图床」的第三方插件是否可信

No. Any third-party plugin that claims to be a “PicGo Official image host” (including, but not limited to, www.picgo.net) is not an official PicGo image host or service. Please do not trust such claims.

An official PicGo image host (if any) would be built into PicGo out of the box — it would not require you to download and install a “third-party plugin”, and it would not direct you to an unknown website to purchase or configure a so-called “official image host”. If you choose to use third-party image hosts, please prefer community plugins from reputable sources and assess their safety yourself.

不可信。所有打着「PicGo 官方图床」旗号的第三方插件（包括不限于 www.picgo.net 等）都不是 PicGo 官方提供的图床或服务，请勿轻信。

PicGo 不会以“第三方插件”的形式要求你另外下载安装所谓的 PicGo 官方图床。如果 PicGo 真的做了官方图床，一定是开箱即用的内置在本体里的。如果你需要使用第三方图床，请优先参考 PicGo 官方维护的插件集合与社区仓库，并自行甄别来源与安全性。
