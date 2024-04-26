export const modelLibURLPrefix =
  "https://raw.githubusercontent.com/neigeantre/web-llm-croissantllm-libraries/main/";
export const modelHFURLPrefix = "https://huggingface.co/llm-slayer/"

const quantizations = ["q0f16", "q0f32", "q3f16_1", "q4f16_1", "q4f32_1"]

export default {
	"model_list": [
        {
            "model_url": modelHFURLPrefix + "CroissantLLMChat-v0.1-" + quantizations[0] + "-MLC/resolve/main/",
            "model_id": "CroissantLLMChat-v0.1-" + quantizations[0],
            "model_lib_url": modelLibURLPrefix + "CroissantLLMChat-v0.1-" + quantizations[0] + "-webgpu.wasm",
        },
        {
            "model_url": modelHFURLPrefix + "CroissantLLMChat-v0.1-" + quantizations[1] + "-MLC/resolve/main/",
            "model_id": "CroissantLLMChat-v0.1-" + quantizations[1],
            "model_lib_url": modelLibURLPrefix + "CroissantLLMChat-v0.1-" + quantizations[1] + "-webgpu.wasm",
        },
        {
            "model_url": modelHFURLPrefix + "CroissantLLMChat-v0.1-" + quantizations[2] + "-MLC/resolve/main/",
            "model_id": "CroissantLLMChat-v0.1-" + quantizations[2],
            "model_lib_url": modelLibURLPrefix + "CroissantLLMChat-v0.1-" + quantizations[2] + "-webgpu.wasm",
        },
        {
            "model_url": modelHFURLPrefix + "CroissantLLMChat-v0.1-" + quantizations[3] + "-MLC/resolve/main/",
            "model_id": "CroissantLLMChat-v0.1-" + quantizations[3],
            "model_lib_url": modelLibURLPrefix + "CroissantLLMChat-v0.1-" + quantizations[3] + "-webgpu.wasm",
        },
        {
            "model_url": modelHFURLPrefix + "CroissantLLMChat-v0.1-" + quantizations[4] + "-MLC/resolve/main/",
            "model_id": "CroissantLLMChat-v0.1-" + quantizations[4],
            "model_lib_url": modelLibURLPrefix + "CroissantLLMChat-v0.1-" + quantizations[4] + "-webgpu.wasm",
        }
    ],
	"use_web_worker": true
}
