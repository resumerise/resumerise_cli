# resumerise-cli

This is the command line tool for [resumerise](https://resumerise.io), a
platform to create resumes and templates.

The CLI is technically based on [Deno](https://deno.land/) and enables the rapid
development of templates for resumerise.

![Demo](images/demo.gif)

# Getting Started

Install the command-line tool:

```
deno install --allow-net --allow-read --unstable -n resumerise-cli https://deno.land/x/resumerise_cli/index.ts
```

# Usage

```
resumerise-cli serve [path or url to theme]
```

This command runs a live http server to display template changes live. On the
displayed page you can select different target platforms, such as desktop,
mobile or print.

Example:

```
resumerise-cli serve https://deno.land/x/resumerise_theme_retro/mod.ts
```

# License

Available under [the MIT license](http://mths.be/mit).
