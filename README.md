# dsh-cool-plugins

English | [中文](README.zh.md)

One repository for every DeepSeek Harness (DSH) plugin. Each plugin is still its
own npm package, with its own version and its own install unit — only the source
lives here.

## Packages

<table>
  <thead>
    <tr>
      <th width="200">Package</th>
      <th>What it adds</th>
      <th align="center">Published</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-theme/README.md"><code>dsh-cool-theme</code></a></td>
      <td>Appearance switching: dark, light, or system, 34 preset themes, custom themes, and theme sharing</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-terminal/README.md"><code>dsh-cool-terminal</code></a></td>
      <td>A real shell in the session tab bar: workspace grouping, persistent state, common commands, completion, and autostart</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-git/README.md"><code>dsh-cool-git</code></a></td>
      <td>A Git panel: changes and diffs, commits with AI-written messages, history, branches, remote sync, and conflict resolution</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-file/README.md"><code>dsh-cool-file</code></a></td>
      <td>A Files tab: the workspace file tree, with preview and editing</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-session/README.md"><code>dsh-cool-session</code></a></td>
      <td>Session management: a Sessions page in Settings for search, filter, archive, and batch delete, plus a delete row in the session menu</td>
      <td align="center">✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-daily/README.md"><code>dsh-cool-daily</code></a></td>
      <td>Daily articles from your own prompt, kept as Markdown files in the sidebar</td>
      <td align="center">❌</td>
    </tr>
  </tbody>
</table>

## Installing a plugin

**Install by npm package name**

Use DSH's add-plugin action and enter the package name, for example
`dsh-cool-theme`.

**Install from local source**

Once the repository is cloned locally, enter the plugin path directly in the
add-plugin panel's input box. For example:
`/Users/xxx/Desktop/dsh-cool-plugins/plugins/dsh-cool-theme`

## Contributing

Issues and pull requests are welcome.

## License

MIT © CoolTea
