# 東方夢蝶譚

基于Vue 3的文字互动游戏，包含故事引擎、用户系统、社区功能和管理后台。

## 快速开始

### 一键启动
```bash
# Windows
双击 start.bat

# 或手动启动
npm run dev              # 前端
cd server && node index.js  # 后端
```

### 访问地址
- 前端：http://localhost:5173
- 后端：http://localhost:3000
- 管理员：admin / admin

## 核心功能

- 📖 文字互动引擎（打字机效果、分支选择、进度保存、点击快进）
- 📚 故事内容（完整序章、15个节点、多分支剧情）
- ✏️ 故事管理系统（可视化流程图、批量操作、高级搜索、节点预览）
- 👤 用户系统（注册/登录、个人中心、头像上传）
- 💬 社区功能（发帖、评论、点赞、无限滚动）
- 🛡️ 管理后台（数据统计、用户管理、封禁功能）

## 技术栈

### 前端
Vue 3 + Vite + Pinia + Vue Router + Axios + Chart.js + Vue Flow

### 后端
Node.js + Express + MySQL2 + JWT + bcryptjs + Multer

## 首次使用

### 1. 安装依赖
```bash
npm install
cd server && npm install
```

### 2. 配置数据库
- 创建数据库：game
- 导入：`database/full-schema.sql`
- 配置：`server/.env`（默认 root/031120）

### 3. 启动服务
```bash
npm run dev              # 前端
cd server && node index.js  # 后端
```

### 4. 访问
- 前端：http://localhost:5173
- 后端：http://localhost:3000
- 管理员：admin / admin

## 项目结构

```
├── database/        # 数据库SQL文件
├── public/          # 静态资源
├── server/          # 后端服务
│   ├── config/      # 配置文件
│   ├── middleware/  # 中间件
│   ├── routes/      # API路由
│   └── uploads/     # 文件上传
├── src/
│   ├── api/         # API接口
│   ├── components/  # 组件
│   ├── router/      # 路由
│   ├── stores/      # 状态管理
│   └── views/       # 页面
├── start.bat        # 启动脚本
└── stop.bat         # 停止脚本
```

## 常见问题

### 端口被占用
```bash
netstat -ano | findstr :5173
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

### 数据库连接失败
检查 `server/.env` 配置和MySQL服务状态

## License

MIT
