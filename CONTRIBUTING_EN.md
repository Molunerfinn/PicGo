## Contribution Guidelines

### Installation and startup

1. Use [yarn](https://yarnpkg.com/) to install dependencies

```bash
yarn install
```

then pass

```bash
yarn dev
```

Startup project.

2. Please add code only related to the main process of Electron in the `src/main` directory. Code only related to the rendering process should be added in the `src/renderer` directory. Add code that can be used by both processes in the `src/universal` directory. **Note**: The rendering process does not have the `Node.js` capability. All rendering processes need to use `Node.js modules` related code, please add events under `src/main/events/picgoCoreIPC.ts` for processing.

3. Please add all cross-process event names in `src/universal/events/constants.ts`.

4. Please add all global type definitions in `src/universal/types/`, if it is `enum`, please add it in `src/universal/types/enum.ts`.


### i18n

Create a `yml` file for a language under `public/i18n/`, e.g. `zh-Hans.yml`. Then refer to `zh-CN.yml` or `en.yml` to write language files. Also note that PicGo will display the name of the language to the user via `LANG_DISPLAY_LABEL` in the language file.

### Submit code

1. Please check that the code has no extra comments, `console.log` and other debugging code.
2. Before submitting the code, please execute the command `git add . && yarn cz` to invoke PicGo's [Code Submission Specification Tool](https://github.com/PicGo/bump-version). Submit code through this tool.