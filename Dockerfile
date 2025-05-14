# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 只复制依赖相关文件，利用Docker缓存
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .
RUN npm run build

# 运行阶段
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# 只复制必要的文件
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 非root用户运行
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "start"] 