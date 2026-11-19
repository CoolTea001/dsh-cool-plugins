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
      <td>外观切换：深色/浅色/跟随系统，34 款预设主题，自定义主题与主题分享</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-terminal/README.md"><code>dsh-cool-terminal</code></a></td>
      <td>会话标签栏中的真实 shell：工作区分组、状态常驻、常用命令、命令补全与自启动</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-git/README.md"><code>dsh-cool-git</code></a></td>
      <td>Git 面板：变更与 Diff、AI 生成提交信息、历史、分支、远端同步与冲突解决</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-file/README.md"><code>dsh-cool-file</code></a></td>
      <td>Files 标签页：工作区文件树，支持预览与编辑</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-session/README.md"><code>dsh-cool-session</code></a></td>
      <td>会话管理：设置中的 Sessions 页支持搜索、筛选、归档与批量删除，会话菜单中另有删除入口</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-daily/README.md"><code>dsh-cool-daily</code></a></td>
      <td>按自己的提示词每天生成文章，以 Markdown 文件保存在侧边栏</td>
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
