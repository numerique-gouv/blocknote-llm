<div align="center">

# BlockNoteLLM

[Demo App](https://numerique-gouv.github.io/blocknote-llm/)

</div>

## Overview

A proof of concept of what can be done with the BlockNote editor based on ProseMiror and an LLM running in the browser

- Fully private = No data ever leaves your computer
- Runs in the browser = No server needed and no install needed!
- Works offline
- Easy-to-use interface

This tool is built on top of [WebLLM](https://github.com/mlc-ai/web-llm), a package that brings language model inference directly onto web browsers with hardware acceleration.

## System Requirements

To run this, you need a modern browser with support for WebGPU. According to [caniuse](https://caniuse.com/?search=WebGPU), WebGPU is supported on:

- Google Chrome
- Microsoft Edge
- All Chronium-based browsers

It's also available in Firefox Nightly, but it needs to be enabled manually through the dom.webgpu.enabled flag. Safari on MacOS also has experimental support for WebGPU which can be enabled through the WebGPU experimental feature.

In addition to WebGPU support, you need to have enough available RAM on your device to run the model (~5,5Gb).

You can check if your browser or your device support WebGPU by visiting [webgpureport](https://webgpureport.org/).

## Supported model

We use [Llama3](https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct), a 8B language model. This model was developed by Meta, and it takes up 5.2 Gb of storage in the browser's cache.

You can directly use the compiled version of Llama3 for WebLLM, which follows the compilation process of [MLC](https://mlc.ai/). We chose to use the quantized model of Llama3 (q4f16) with the half precision model, because it has the best performance-to-memory usage ratio.

You can also use another model. To do that, you can compile your own model and weights with [MLC LLM](https://github.com/mlc-ai/mlc-llm). Then you just need to update [app-config](./src/app-config.ts) with:

- The URL to model artifacts, such as weights and meta-data.
- The URL to web assembly library (i.e. wasm file) that contains the executables to accelerate the model computations.
- The name of the model.

You also need to change the custom prompt added before the user's text in the [prompt](./src/prompt.ts) file.

If you need further information, you can check the [MLC LLM documentation](https://llm.mlc.ai/docs/deploy/javascript.html) on how to add new model weights and libraries to WebLLM.

**Disclaimer**: We use the chat version of Llama3, specifically fine-tuned for chat interactions rather than our specific use cases. Hence, you may encounter some limitations or inaccuracies in the response. Additionally, as with any LLM, it's possible to encounter hallucinations or inaccuracies in generated text.

## Try it out

You can [try it here](https://numerique-gouv.github.io/blocknote-llm/). You can also run the project locally and contribute to improve the interface, speed up initial model loading time and fix bugs, by following these steps:

### Prerequisite

- NodeJS >= 20 - https://nodejs.org/
- NPM

### Setup & Run The Project

If you're looking to make changes, run the development environment with live reload:

```sh
# Clone the repository
git clone https://github.com/numerique-gouv/blocknote-llm.git

# Enter the project folder
cd ./blocknote-llm

# Install dependencies
npm install

# Start the project for development
npm run dev
```

### Building the project for production

To compile the React code yourself, run:

```sh
# Compile and minify the project for publishing, outputs to `dist/`
npm run build

# Build the project for publishing and preview it locally. Do not use this as a production server as it's not designed for it
npm run preview
```

This repository has a workflow that automatically deploys the site to GitHub Pages whenever the main branch is modified

## License

This work is released under the MIT License (see [LICENSE](./LICENSE)).
