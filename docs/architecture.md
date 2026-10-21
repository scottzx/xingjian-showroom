# 架构与公开版范围

应用以 React 管理界面和方案状态，以 Three.js 管理场景、材质、相机、选区及导出。商品、客户、区域和材质由 TypeScript 配置定义，多个行业共用一套展示框架。

```text
src/
├── catalog/             商品、客户、材质及方案契约
├── features/sharing/    链接编码、校验、本机存储
├── pages/               首页、展示页与专用 CAD 面板
├── scenarios/           行业模型工厂与外部模型适配
├── viewer/              Three.js 生命周期和编辑器预览
├── editor/              Konva 二维图案编辑器
└── styles/brand.css     品牌颜色变量
```

## 公开版与本地工作项目

此仓库是本地工作项目的公开发行快照，保留应用源码并将原来的私有应用子模块展开为普通目录。源码历史从此公开快照开始；私有工作区的 Git 历史、凭据、支付图片和运行记录没有上传。

公开目录启用当前全部六个商品，首页逐个列出。三个程序化示例和三个 CAD 派生示例共用注册表与渲染器。`public/models/` 收录经维护者确认公开的派生 JSON/GLB、SVG 平面、C108 对照图及说明；原始 DWG/DXF 不分发。模型素材来源与限制见 [model-assets.md](model-assets.md)。公开测试检查六场景目录、模型包完整性、分享/存储、CAD 渲染与关键几何；不代表工程图纸完整性认证。

## 接入自己的模型

GLB 商品通过 `src/scenarios/registry.ts` 加载，可按节点名或 `userData.surfaceId` 将网格映射到可配置区域。所有物理量统一使用米，并设置适当的相机范围。

CAD 适配器的数据结构见 `src/scenarios/interior/cadTypes.ts`、`src/scenarios/construction-site/types.ts`、`src/scenarios/construction-cad/types.ts`。取得明确使用权限并准备数据后，在商品目录中添加自己的产品和客户，即可接入。模型 URL 与静态下载链接统一使用 `publicAssetUrl`，该函数读取 `import.meta.env.BASE_URL`，兼容网站根目录、GitHub Pages 子目录及可搬移静态包。

图纸坐标、楼层、开口、单位及竖向依据需要独立核验；示意材质不能证明模型尺寸正确。未知标高、埋深、管线走向及施工变化要保留未知状态，模型不提供可钻孔结论。

## 配色

墨绿 `#285B4D`、米白 `#F7F4EB`、香槟老金 `#CBB078`、深墨 `#202D29`。金色用于主入口与少量标志/细线，阅读文字采用深墨或经过对比度检查的深金色。

## 旧编辑器

二维工作台继承上游的图层、画笔、文本、形状和导出能力。公开版使用本项目原创的通用示意图，不包含 Tesla 官方车型模板；导出结果不能直接视为具体车型的 UV 文件。三维预览使用通用车身，精确 UV 对应需要自行接入正确且有权使用的模型与模板。
