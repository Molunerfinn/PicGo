# 阿里云 OSS 图床配置指南（更新版）

> 本文档补充了阿里云 OSS **无地域属性资源包（Regionless Bucket）**的配置说明。
> 对应 Issue: [#1269](https://github.com/Molunerfinn/PicGo/issues/1269)

---

## 前提条件

1. 拥有阿里云账号并开通 OSS 服务
2. 创建一个 OSS Bucket（存储桶）
3. 获取 AccessKey ID 和 AccessKey Secret

---

## 配置步骤

### 步骤一：获取 AccessKey

1. 登录 [阿里云 RAM 控制台](https://ram.console.aliyun.com/)
2. 创建 RAM 用户（推荐使用子账号）或使用现有用户
3. 为 RAM 用户授权 `AliyunOSSFullAccess` 或自定义权限策略
4. 获取 **AccessKey ID** 和 **AccessKey Secret**

### 步骤二：确定 Bucket 类型

阿里云 OSS 目前支持两种存储桶类型：

| 类型 | 说明 |
|---|---|
| **有地域属性（Regional）** | 传统方式，存储于特定地域（如华东1-杭州） |
| **无地域属性（Regionless）** ⭐新增 | 2024年新特性，不绑定特定地域，适用于跨地域访问场景 |

### 步骤三：配置 PicGo

打开 PicGo 图床设置，选择「阿里云 OSS」：

#### 方式 A：标准 Bucket（有地域属性）

| 配置项 | 说明 | 示例 |
|---|---|---|
| KeyId | AccessKey ID | `LTAI5tXXXXXXXXXXXXXX` |
| KeySecret | AccessKey Secret | `XXXXXXXXXXXXXXXXXXXXXXXX` |
| Bucket | 存储桶名称 | `my-picgo-bucket` |
| Area | 存储区域 | `oss-cn-hangzhou` |
| Path | 存储路径（可选） | `images/` |
| CustomUrl | 自定义域名（可选） | `https://cdn.example.com` |

**常用 Region（地域/Area）列表：**

| 地域名称 | Region ID（Area 字段） |
|---|---|
| 华东1（杭州） | `oss-cn-hangzhou` |
| 华东2（上海） | `oss-cn-shanghai` |
| 华北1（青岛） | `oss-cn-qingdao` |
| 华北2（北京） | `oss-cn-beijing` |
| 华北3（张家口） | `oss-cn-zhangjiakou` |
| 华南1（深圳） | `oss-cn-shenzhen` |
| 华南2（河源） | `oss-cn-heyuan` |
| 华南3（广州） | `oss-cn-guangzhou` |
| 西南1（成都） | `oss-cn-chengdu` |
| 中国香港 | `oss-cn-hongkong` |
| 新加坡 | `oss-ap-southeast-1` |
| 美国（硅谷） | `oss-us-west-1` |

#### 方式 B：无地域属性 Bucket（Regionless）⭐ 新增

> 💡 无地域属性 Bucket 的 **Area 字段应留空或填写 `oss-rg-china-mainland`**

| 配置项 | 说明 | 示例 |
|---|---|---|
| KeyId | AccessKey ID | `LTAI5tXXXXXXXXXXXXXX` |
| KeySecret | AccessKey Secret | `XXXXXXXXXXXXXXXXXXXXXXXX` |
| Bucket | 无地域属性 Bucket 名称 | `my-regionless-bucket` |
| Area | **留空** 或填 `oss-rg-china-mainland` | （留空） |
| Path | 存储路径（可选） | `images/` |
| CustomUrl | 自定义域名（推荐） | `https://cdn.example.com` |

**注意事项：**
- 无地域属性 Bucket 的名称有特殊格式要求，以 `--` 开头
- 该类型目前仅支持中国大陆地域
- 建议配置 **CustomUrl** 或使用默认的 `oss-rg-china-mainland.aliyuncs.com` 域名
- 上传后的默认 URL 格式为：`https://{bucket}.oss-rg-china-mainland.aliyuncs.com/{path}/{filename}`

---

## 常见问题

### Q: 如何知道我的 Bucket 是否有地域属性？

A: 登录 [OSS 控制台](https://oss.console.aliyun.com/)，查看 Bucket 列表：
- 有地域属性的 Bucket 会显示具体 Region（如华东1-杭州）
- 无地域属性的 Bucket 会显示"无地域属性"标记

### Q: 上传失败，提示 "endpoint" 错误？

A: 请检查：
1. Area 字段是否正确填写
2. 对于无地域属性 Bucket，Area 应留空
3. 确认 Bucket 名称和 AccessKey 配置正确

### Q: 访问 URL 无法显示图片？

A: 请检查：
1. Bucket 的读写权限是否设置为"公共读"
2. 如果使用 CustomUrl，确认 CDN/域名已正确配置 CNAME
3. 确认 Bucket 的防盗链设置未阻止访问

---

## 参考链接

- [阿里云 OSS 地域和访问域名](https://help.aliyun.com/zh/oss/user-guide/regions-and-endpoints)
- [PicGo 官方文档](https://docs.picgo.app/)
- [PicGo 图床配置指南](https://docs.picgo.app/gui/guide/config)

---

> 本文档更新于 2026-06-13，基于阿里云 OSS 最新功能（无地域属性资源包）
