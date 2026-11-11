# Pi Goal Retry

基于 `@narumitw/pi-goal 0.55.0`，版本 `0.55.0-retry.2`。保留上游 MIT 许可和原有 `/goal`、任务完成证据、Token 预算、暂停、恢复、会话保存功能。支持 Pi。

这版解决的是：上游报出 `Antigravity: the reply ended before it was complete` 等未被 Pi 原生识别的请求错误时，Goal 不再无限等待手动输入，而会自动安排下一次请求。

## 默认行为

- 一段连续失败中，初次请求之外最多重试 **10 次**。Pi 自身的原生重试也计入同一上限，不叠加成多层独立重试预算。
- 新增恢复的退避间隔按重试序号计算：10 秒、20 秒、40 秒、80 秒，之后每次最多 120 秒。原生 Pi 重试仍使用它自己的较短间隔。
- 成功得到一条模型响应后，连续失败计数归零；工具调用响应也属于成功响应。显式手动恢复会开启新一轮重试额度。
- 自动重试共用 Goal 的持久化等待和单次派发机制，仅在 Pi 空闲且没有排队消息时触发。
- `/goal pause` 会取消等待中的重试；`/goal clear`、目标替换、会话退出、预算耗尽也会使旧计时器失效。
- `/reload` 和重新打开同一会话会保留失败计数及原来的绝对重试时间；不会因为重新加载而延长等待或重新获得十次机会。
- 达到重试上限后暂停并保留进度，输入 `/goal resume` 可以再试。

明确的认证或权限错误、无效请求会暂停。额度/余额错误保留上游原有的 `retryUsageLimits` 机制，默认关闭。上下文溢出仍交由 Pi 压缩恢复。重试不会改变原目标、改写提示词、自动更换账号或模型。

同一条日志可能同时包含“Gemini 过滤”和“回复提前结束”。从 `0.55.0-retry.2` 开始，只要该请求以错误结束，这种组合也按同一套 10 次上限和退避间隔自动重试。模型正文中的提示不再触发立即暂停；`content_filter`、`SAFETY` 等上游错误标签也使用有限重试。正常完成的响应不会因为其正文内容而触发重试。

旧窗口更新后执行 `/reload`，再用 `/goal resume` 恢复之前暂停的目标。

## 安装

```text
pi install git:github.com/Tiancaizhi9098/pi-goal-retry
```

此命令只安装 Goal Retry。已有其他 Goal 扩展时，请先移除对应加载声明，避免重复注册 `/goal`；原版可用 `pi remove npm:@narumitw/pi-goal` 移除。本地修改版也只保留一个加载来源。

仓库已包含构建后的 `dist/`，无需先构建。克隆仓库后也可以在根目录运行 `pi install .`。

## 当前窗口如何启用

安装后，在原来的 Pi 窗口输入 `/reload`。已有等待中或暂停的目标再输入 `/goal resume`：

```text
/reload
/goal resume
```

新建目标仍用 `/goal 你的目标`。查看状态用 `/goal status`。等待重试时，状态栏会显示序号、上限和等待秒数。

`/goal` → Settings 中新增 `Retry provider errors` 和 `Provider retry limit`。也可编辑 `~/.pi/agent/pi-goal.json` 后 `/reload`：

```json
{
  "providerRetry": {
    "enabled": true,
    "maxRetries": 10,
    "baseDelayMs": 10000,
    "maxDelayMs": 120000
  }
}
```

请把这些字段合并到现有配置。原来的自动响应次数上限、无进展保护和 Token 预算仍然生效，可能比重试次数先达到。

## Windows 本地复制安装与回退

Windows PowerShell 7，在这个源码包目录运行：

```powershell
pwsh -NoProfile -File ./scripts/install.ps1 -MaxRetries 10
```

安装器把包复制到 `~/.pi/agent/local/pi-goal-retry`，替换全局 packages 中原来的 `npm:@narumitw/pi-goal` 声明，保留已缓存的原 npm 包。配置备份保存在 `~/.pi/agent/backups/pi-goal-retry-时间戳/`。不会同时注册两个 `/goal`。

回退到原版：

```powershell
pwsh -NoProfile -File ./scripts/rollback.ps1
```

然后在 Pi 中 `/reload`。回退脚本只替换包声明，保留其他最新设置、目标历史和本地源码。

## 源码与验证

新增 `src/provider-error-recovery.ts` 负责错误分类、共享失败计数、退避和恢复。`settings.ts`、`settings-ui.ts` 提供配置，`persistence.ts`、`wait.ts` 保存重试状态，`lifecycle.ts` 接入响应和会话事件。重用上游调度器，不修改 Pi 核心安装文件。

`test/recovery.test.mjs` 验证恢复状态机、十次上限、持久化、取消、模型切换、预算和错误分类。`test/sdk.test.mjs` 通过真实 Pi AgentSession 和模型流接口注入模拟错误，验证再次请求、暂停以及原生重试合并计数。这些测试不向 Gemini 或其他付费模型发送请求。

在仓库根目录安装依赖并验证：

```powershell
npm ci --ignore-scripts
npm run build
npm test
npm run typecheck
```

`dist/` 已构建，可直接安装。测试优先使用仓库安装的 Pi SDK，也支持已有的 Pi 托管安装作为后备。`@narumitw/pi-tui-kit` 被打包进运行文件，Pi 自身和 TypeBox 由宿主提供。

## 卸载

```text
pi remove git:github.com/Tiancaizhi9098/pi-goal-retry
```

然后在 Pi 中执行 `/reload`。目标历史和个人配置保留。

`UPSTREAM-README.md` 和 `docs/` 是上游 0.55.0 的参考资料，其中“不额外重试”的说明已被本地修改覆盖，以此 README 为准。原项目：[narumiruna/pi-extensions](https://github.com/narumiruna/pi-extensions/tree/main/packages/pi-goal)。
