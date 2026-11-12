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
      <th>Published</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-theme/README.md"><code>dsh-cool-theme</code></a></td>
      <td>Appearance switching: preset themes, custom themes, and theme sharing</td>
      <td>✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-terminal/README.md"><code>dsh-cool-terminal</code></a></td>
      <td>A real shell in the session tab bar, with workspace sync and command completion</td>
      <td>✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-git/README.md"><code>dsh-cool-git</code></a></td>
      <td>A Git panel: view changes, commit, browse history and branches, sync with the remote, resolve conflicts</td>
      <td>✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-file/README.md"><code>dsh-cool-file</code></a></td>
      <td>A Files tab: browse the workspace and preview text files</td>
      <td>❌</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-session/README.md"><code>dsh-cool-session</code></a></td>
      <td>A Sessions page in Settings: search, filter, archive, and batch delete</td>
      <td>✅</td>
    </tr>
    <tr>
      <td width="200"><a href="plugins/dsh-cool-daily/README.md"><code>dsh-cool-daily</code></a></td>
      <td>Daily AI-generated articles from a custom prompt</td>
      <td>❌</td>
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
