## 常见问题

> 在使用 PicGo 期间你会遇到很多问题，不过很多问题其实之前就有人提问过，也被解决，所以你可以先看看 [使用文档](https://picgo.github.io/PicGo-Doc/zh/guide/getting-started.html#%E5%BF%AB%E9%80%9F%E4%B8%8A%E6%89%8B)，这份 FAQ，以及那些被关闭的 [issues](https://github.com/Molunerfinn/PicGo/issues?q=is%3Aissue+is%3Aclosed)，应该能找到答案。

## 1. 七牛图床上传图片成功后，相册里无法显示或图片无`http://`前缀

通常是你的七牛图床配置里的`设定访问网址`没有加上`http://`或者`https//`头。

参考：[issue#79](https://github.com/Molunerfinn/PicGo/issues/79)

## 2. 能否支持图床远端同步删除

不能。有些图床（比如微博图床、SM.MS、Imgur 等）不支持后台管理，为了架构统一不支持远端删除。

## 3. 能否支持上传视频文件

目前不能。如果有人开发了相应的插件理论可以支持任意文件上传。

## 4. 微博图床上传之后无法显示预览图

通常是挂了全局代理导致的。

参考：[issue36](https://github.com/Molunerfinn/PicGo/issues/36)

## 5. 能否支持某某某图床

截止 v1.6，PicGo 支持了如下图床：

- `微博图床` v1.0
- `七牛图床` v1.0
- `腾讯云 COS v4\v5 版本` v1.1 & v1.5.0
- `又拍云` v1.2.0
- `GitHub` v1.5.0
- `SM.MS` v1.5.1
- `阿里云 OSS` v1.6.0
- `Imgur` v1.6.0

所以本体内将不会再支持其他图床。需要其他图床支持可以参考目前已有的三方 [插件](https://github.com/PicGo/Awesome-PicGo)，如果还是没有你所需要的图床欢迎开发一个插件供大家使用。

## 6. 一个图床设置多个信息

不能。因为目前的架构只支持一个图床一份信息。

## 7. GitHub 图床有时能上传，有时上传失败

1. GitHub 图床不支持上传同名文件，如果有同名文件上传，会报错。建议开启 `时间戳重命名` 避免同名文件。
2. GitHub 服务器和国内 GFW 的问题会导致有时上传成功，有时上传失败，无解。想要稳定请使用付费云存储，如阿里云、腾讯云等，价格也不会贵。

## 8. Mac 上无法打开 PicGo 的主窗口界面

PicGo 在 Mac 上是一个顶部栏应用，在 dock 栏是不会有图标的。要打开主窗口，请右键或者双指点按顶部栏 PicGo 图标，选择「打开详细窗口」即可打开主窗口。

## 9. 上传失败，或者是服务器出错

1. PicGo 自带的图床都经过测试，上传出错一般都不是 PicGo 自身的原因。如果你用的是 GitHub 图床请参考上面的第 7 点。
2. 检查 PicGo 的日志（报错日志可以在 PicGo 设置 -> 设置日志文件 -> 点击打开 后找到），看看 `[PicGo Error]` 的报错信息里有什么关键信息
   1. 先自行搜索 error 里的报错信息，往往你能百度或者谷歌出问题原因，不必开 issue。
   2. 如果有带有 `401` 、`403` 等 `40X` 状态码字样的，不用怀疑，就是你配置写错了，仔细检查配置，看看是否多了空格之类的。
   3. 如果带有 `HttpError`、`RequestError` 、 `socket hang up` 等字样的说明这是网络问题，我无法帮你解决网络问题，请检查你自己的网络，是否有代理，DNS 设置是否正常等。
3. 通常网络问题引起的上传失败都是因为代理设置不当导致的。如果开启了系统代理，建议同时也在 PicGo 的代理设置中设置对应的HTTP代理。参考 [#912](https://github.com/Molunerfinn/PicGo/issues/912)

## 10. macOS版本安装完之后没有主界面

请找到PicGo在顶部栏的图标，然后右键（触摸板双指点按，或者鼠标右键），即可找到「打开详细窗口」的菜单。

## 11. 相册突然无法显示图片 或者 上传后相册不更新 或者 使用Typora+PicGo上传图片成功但是没有写回Typora

这个原因可能是相册存储文件损坏导致的。可以找到 PicGo 配置文件所在路径下的 `picgo.db` ，将其删掉（删掉前建议备份一遍），再重启 PicGo 试试。
注意同时看看日志文件里有没有什么error，必要时可以提issue。2.3.0以上的版本已经解决因为 `picgo.db` 损坏导致的上述问题，建议更新版本。

## 12. Gitee相关问题

如果在使用 Gitee 图床的时候遇到上传的问题，由于 PicGo 并没有官方提供 Gitee 上传服务，无法帮你解决，请去你所使用的 Gitee 插件仓库发相关的issue。

## 13. macOS系统安装完PicGo显示「文件已损坏」或者安装完打开没有反应

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
xattr -c /Applications/PicGo.app/*
```

如果上述命令依然没有效果，可以尝试下面的命令：

```
sudo xattr -d com.apple.quarantine /Applications/PicGo.app/
```

2. 如果安装打开后没有反应，请按下方顺序排查：
   1. macOS安装好之后，PicGo 是不会弹出主窗口的，因为 PicGo 在 macOS 系统里设计是个顶部栏应用。注意看你顶部栏的图标，如果有 PicGo 的图标，说明安装成功了，点击图标即可打开顶部栏窗口。参考上述[第八点](#8-mac-上无法打开-picgo-的主窗口界面)。
   2. 如果你是 M1 的系统，此前装过 PicGo 的 x64 版本，但是后来更新了 arm64 的版本发现打开后没反应，请重启电脑即可。
