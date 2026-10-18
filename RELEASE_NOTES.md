# 形见 Xingjian Showroom v0.1.1

首个公开版本的跨平台构建修复，采用 MIT 协议。

补全 Rollup、esbuild、Tailwind Oxide 和 Lightning CSS 的平台可选依赖锁，修复 Linux / GitHub Actions 构建。直接依赖版本保持不变。

## 本次发布

- 室内空间、通用车身改色、包装外观三类交互演示。
- 分区材质配置、默认效果对比、自动旋转、全屏与 PNG 导出。
- 本机方案保存、链接分享与 JSON 方案导出。
- 二维图案工作台和原创通用示意模板。
- 一芥智能品牌配色：墨绿、米白、香槟老金与深墨。
- CAD/GLB 模型接入源码，以及 GitHub Actions / Pages 自动部署配置。

## 开始使用

在线演示：https://scottzx.github.io/xingjian-showroom/

```sh
git clone https://github.com/scottzx/xingjian-showroom.git
cd xingjian-showroom
npm ci
npm run dev
```

需要 Node.js 22.18+。默认演示无需账号、数据库、私有子模块或环境变量。

## 下载

- `xingjian-showroom-v0.1.1-web.zip`：已构建的静态网站，使用任意 HTTP 静态服务器部署。
- `SHA256SUMS.txt`：下载校验值。
- GitHub 自动提供的 Source code：此版本完整的公开发行源码。

## 验证与范围

公开发行的 10 项测试及 TypeScript / Vite 生产构建通过。已检查三维首页与通用图案工作台的资源加载。

本版本使用原创程序化示意模型。私有 CAD、C108/IFG 派生数据、许可未知的教学 CAD、厂商车型模板、内部执行记录及凭据未随包分发；CAD 接入能力保留在源码中。依赖这些未分发材料的工程专用验收用例不属于本公开版测试范围。软件采用 MIT，第三方依赖保留各自许可证；通用车身示意不构成具体车型的精确 UV 模型。
