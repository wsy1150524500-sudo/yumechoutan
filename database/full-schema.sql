-- 東方夢蝶譚 完整数据库结构
-- 数据库名：game
-- 字符集：utf8mb4

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS game DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE game;

-- ============================================
-- 用户系统表
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  avatar VARCHAR(255) DEFAULT '/img/fm.png',
  is_admin BOOLEAN DEFAULT FALSE,
  banned_until DATETIME DEFAULT NULL COMMENT '封禁结束时间，NULL表示未封禁',
  ban_reason VARCHAR(500) DEFAULT NULL COMMENT '封禁原因',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_banned (banned_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 故事系统表
-- ============================================

-- 章节表
CREATE TABLE IF NOT EXISTS chapters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  chapter_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order (chapter_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 故事节点表
CREATE TABLE IF NOT EXISTS story_nodes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  chapter_id INT NOT NULL,
  node_key VARCHAR(50) NOT NULL COMMENT '节点唯一标识',
  character_name VARCHAR(50) COMMENT '角色名称',
  character_image VARCHAR(255) COMMENT '角色立绘路径',
  background_image VARCHAR(255) COMMENT '背景图路径',
  dialogue_text TEXT NOT NULL COMMENT '对话文本',
  node_order INT NOT NULL COMMENT '节点顺序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  INDEX idx_chapter (chapter_id),
  INDEX idx_order (node_order),
  UNIQUE KEY uk_node_key (node_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 选项表
CREATE TABLE IF NOT EXISTS choices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  node_id INT NOT NULL,
  choice_text VARCHAR(255) NOT NULL COMMENT '选项文本',
  next_node_id INT COMMENT '下一个节点ID，NULL表示结束',
  choice_order INT NOT NULL COMMENT '选项顺序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES story_nodes(id) ON DELETE CASCADE,
  INDEX idx_node (node_id),
  INDEX idx_order (choice_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户进度表
CREATE TABLE IF NOT EXISTS user_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  chapter_id INT NOT NULL,
  current_node_id INT NOT NULL,
  last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  FOREIGN KEY (current_node_id) REFERENCES story_nodes(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_chapter (user_id, chapter_id),
  INDEX idx_user (user_id),
  INDEX idx_last_played (last_played)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户选择记录表
CREATE TABLE IF NOT EXISTS user_choices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  node_id INT NOT NULL,
  choice_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (node_id) REFERENCES story_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (choice_id) REFERENCES choices(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_node (node_id),
  INDEX idx_choice (choice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 社区系统表
-- ============================================

-- 社区帖子表
CREATE TABLE IF NOT EXISTS community_posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
  is_official BOOLEAN DEFAULT FALSE COMMENT '是否官方帖子',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_created (created_at),
  INDEX idx_pinned (is_pinned),
  INDEX idx_official (is_official),
  FULLTEXT idx_search (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 帖子点赞表
CREATE TABLE IF NOT EXISTS post_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_post_user (post_id, user_id),
  INDEX idx_post (post_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 帖子评论表
CREATE TABLE IF NOT EXISTS post_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  like_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_post (post_id),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评论点赞表
CREATE TABLE IF NOT EXISTS comment_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  comment_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_comment_user (comment_id, user_id),
  INDEX idx_comment (comment_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 资讯系统表
-- ============================================

-- 资讯表
CREATE TABLE IF NOT EXISTS news (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 角色系统表
-- ============================================

-- 角色表
CREATE TABLE IF NOT EXISTS characters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  image VARCHAR(255),
  role VARCHAR(50) COMMENT '角色定位',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 初始数据
-- ============================================

-- 插入管理员账户（密码：admin，已使用bcrypt加密）
INSERT INTO users (username, password, is_admin) VALUES 
('admin', '$2a$10$YourHashedPasswordHere', TRUE)
ON DUPLICATE KEY UPDATE username=username;

-- 注意：实际使用时需要替换上面的密码哈希值
-- 可以使用以下Node.js代码生成：
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('admin', 10);
-- console.log(hash);
