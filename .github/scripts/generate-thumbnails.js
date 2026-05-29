const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 缩略图配置
const THUMB_SUFFIX = '-thumb';   // 缩略图后缀
const THUMB_WIDTH = 400;         // 缩略图宽度
const THUMB_HEIGHT = 400;        // 缩略图高度

// 需要排除的目录（不处理）
const EXCLUDED_DIRS = ['.git', '.github', 'node_modules', '.vscode'];

// 支持的图片扩展名
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

async function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // 跳过排除的目录
      if (EXCLUDED_DIRS.includes(item)) continue;
      await processDirectory(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (!IMAGE_EXTS.includes(ext)) continue;
      // 避免处理已经是缩略图的文件
      if (item.includes(THUMB_SUFFIX)) continue;

      const inputPath = fullPath;
      const nameWithoutExt = path.basename(item, ext);
      const thumbName = `${nameWithoutExt}${THUMB_SUFFIX}${ext}`;
      const outputPath = path.join(dirPath, thumbName);

      // 检查是否需要生成（缩略图不存在或比原图旧）
      let needGenerate = true;
      if (fs.existsSync(outputPath)) {
        const inputStat = fs.statSync(inputPath);
        const outputStat = fs.statSync(outputPath);
        if (outputStat.mtimeMs >= inputStat.mtimeMs) {
          needGenerate = false;
        }
      }

      if (needGenerate) {
        try {
          await sharp(inputPath)
            .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: 'cover' })
            .toFile(outputPath);
          console.log(`✅ 生成缩略图: ${path.relative(process.cwd(), outputPath)}`);
        } catch (err) {
          console.error(`❌ 处理失败 ${item}:`, err.message);
        }
      }
    }
  }
}

async function main() {
  console.log('开始扫描所有目录并生成缩略图...');
  const rootDir = process.cwd();  // 即仓库根目录
  await processDirectory(rootDir);
  console.log('缩略图生成完成');
}

main().catch(console.error);
