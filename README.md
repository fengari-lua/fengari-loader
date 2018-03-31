[![Build Status](https://travis-ci.org/fengari-lua/fengari-loader.svg?branch=master)](https://travis-ci.org/fengari-lua/fengari-loader)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![#fengari on Freenode](https://img.shields.io/Freenode/%23fengari.png)](https://webchat.freenode.net/?channels=fengari)

<div align="center">
  <a href="https://fengari.io/"><img height="200" src="https://fengari.io/static/images/logo.png"></a>
  <a href="https://github.com/webpack/webpack"><img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg"></a>
  <h1>Fengari Loader</h1>
</div>

[Fengari](https://fengari.io/) is a lua VM written in Javascript. [Webpack](http://webpack.js.org/) is a piece of Javascript tooling to compile scripts and other assets together.
This repository contains a [webpack loader](https://webpack.js.org/concepts/#loaders) that allows you to require lua scripts when creating your web page/application.

## Install

```bash
npm install fengari-lua/fengari-loader fengari-web webpack webpack-cli --save-dev
```

fengari-loader requires fengari-web and webpack as peerDependency. Thus you are able to control the versions accurately.


## Usage

**src/mycode.lua**
```js
return {
  42
}
```

**src/index.js**
```js
import mycode from './mycode.lua'
```

**webpack.config.js**
```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.lua$/,
        use: [
          { loader: "fengari-loader" }
        ]
      }
    ]
  }
}
```


## Options

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**`dependencies`**|`{Object\|undefined}`|`undefined`|If `undefined`, analyse the required lua file for `require` calls. Otherwise, manually specifies the dependencies as a map from require string to webpack module name|
|**`strip`**|`{Boolean}`|`false`|If `true`, emit stripped lua bytecode instead of source|


## How does it work?

fengari-loader [preloads](https://www.lua.org/manual/5.3/manual.html#pdf-package.preload) lua modules into [fengari-web](https://github.com/fengari-lua/fengari-web)'s global state.

Additionally, fengari-loader analyses lua code for calls to the lua global `require`, and adds the require strings as dependencies to the current webpack module.
