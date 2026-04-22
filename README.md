# Vue 文档管理系统

基于 Vue 3 + Element Plus 的文档管理系统

## 项目结构

```
vue-document/
├── src/
│   ├── api/              # API接口
│   │   └── document.js   # 文档相关API
│   ├── components/       # 通用组件
│   │   ├── Layout.vue    # 布局组件
│   │   └── ProgressDialog.vue  # 进度条组件
│   ├── router/           # 路由配置
│   │   └── index.js
│   ├── store/            # 状态管理
│   ├── utils/            # 工具函数
│   │   ├── permission.js # 权限服务
│   │   └── request.js    # axios封装
│   ├── views/            # 页面组件
│   │   ├── NoPermission.vue      # 无权限页面
│   │   ├── InitDocument.vue      # 初始化文档目录页面
│   │   ├── DocumentManagement.vue # 文档管理页面
│   │   └── DocumentImport.vue    # 文档导入页面
│   ├── App.vue           # 根组件
│   ├── main.js           # 入口文件
│   └── style.css         # 全局样式
├── package.json
└── vite.config.js
```

## 功能特性

### 1. 无权限页面
- 路由访问检验权限
- 展示权限不足原因
- 提供配置跳转按钮
- 展示帮助文档链接

### 2. 初始化文档目录
- 选择文档模板库
- 选择模板文档（树形结构）
- 进度条展示初始化过程

### 3. 文档管理
- 文档内容表格展示
- 文档查看、编辑、删除、下载、重命名
- 文件夹新增、删除、重命名
- 文档生成功能
- 历史记录查看

### 4. 文档导入
- 导入历史列表
- 文件上传和解析
- 详情预览
- 确认导入/取消导入

### 5. 通用组件
- 进度条组件（支持多种场景）

## 技术栈

- Vue 3
- Vue Router 4
- Element Plus
- Axios
- Pinia
- Vite

## 安装和运行

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产环境构建
npm run build
```

## API 接口说明

项目中的API接口需要根据实际后端服务进行配置。主要接口包括：

- `/template/list` - 获取模板库列表
- `/template/:id/docs` - 获取模板文档
- `/document/list` - 获取文档列表
- `/document/:id` - 删除文档
- `/document/:id/download` - 下载文档
- `/document/:id/rename` - 重命名文档
- `/folder` - 新增文件夹
- `/folder/:id` - 删除文件夹
- `/folder/:id/rename` - 重命名文件夹
- `/document/history` - 获取历史记录
- `/import/history` - 获取导入历史
- `/import/:id` - 获取导入详情
- `/import/:id/cancel` - 取消导入
- `/permission/info` - 获取权限信息

## 权限控制

项目实现了完整的权限控制机制：

1. 路由守卫检查权限
2. 无权限时跳转到无权限页面
3. 支持配置跳转和帮助文档链接

## 注意事项

1. PageOffice 相关功能需要集成 PageOffice 控件
2. 文件上传支持 .doc, .docx, .xls, .xlsx, .pdf 格式
3. 进度条组件支持自定义标题、描述和进度文字
