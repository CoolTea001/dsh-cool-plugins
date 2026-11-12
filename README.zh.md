# dsh-cool-plugins

[English](README.md) | 中文

本仓库集中维护多款 DeepSeek Harness（DSH）插件。每个插件仍是独立的 npm 包，拥有独立的版本号和安装单元，这里只存放它们的源码。

## 插件列表

<table>
  <thead>
    <tr>
      <th width="200">插件</th>
      <th>简介</th>
      <th align="center">已发布</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-theme/README.md"><code>dsh-cool-theme</code></a></td>
      <td>外观切换：预设主题、自定义主题与主题分享</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-terminal/README.md"><code>dsh-cool-terminal</code></a></td>
      <td>在会话标签栏中提供真实 shell，支持工作区同步与命令补全</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-git/README.md"><code>dsh-cool-git</code></a></td>
      <td>Git 面板：查看改动、提交、历史与分支，同步远端，解决冲突</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-file/README.md"><code>dsh-cool-file</code></a></td>
      <td>Files 标签页：浏览工作区并预览文本文件</td>
      <td align="center">❌</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-session/README.md"><code>dsh-cool-session</code></a></td>
      <td>设置中的 Sessions 页：搜索、筛选、归档与批量删除</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-daily/README.md"><code>dsh-cool-daily</code></a></td>
      <td>按自定义提示词生成每日 AI 文章</td>
      <td align="center">❌</td>
    </tr>
  </tbody>
</table>

## 安装插件

**npm 包名安装**

使用 DSH 的新增插件功能，输入对应的包名即可安装，例如 `dsh-cool-theme`。

**本地源码安装**

项目克隆至本地后，可以直接在新增插件面板输入框中输入插件路径安装。例如：`/Users/xxx/Desktop/dsh-cool-plugins/plugins/dsh-cool-theme`

## 参与贡献

欢迎提交 Issue 与 PR。

## 许可证

MIT © CoolTea
