export const modelLibURLPrefix =
  "https://raw.githubusercontent.com/neigeantre/web-llm-croissantllm-libraries/main/";
export const modelHFURLPrefix = "https://huggingface.co/llm-slayer/"

const models = [
    "CroissantLLMChat-v0.1-q0f16", 
    "CroissantLLMChat-v0.1-q0f32",
    "CroissantLLMChat-v0.1-q3f16_1",
    "CroissantLLMChat-v0.1-q4f16_1",
    "CroissantLLMChat-v0.1-q4f32_1"
]

export const appConfig = {
	"model_list": [
        {
            "model_url": modelHFURLPrefix + models[0]+ "-MLC/resolve/main/",
            "model_id": models[0],
            "model_lib_url": modelLibURLPrefix + models[0] + "-webgpu.wasm"
        },
        {
            "model_url": modelHFURLPrefix + models[1]+ "-MLC/resolve/main/",
            "model_id": models[1],
            "model_lib_url": modelLibURLPrefix + models[1] + "-webgpu.wasm"
        },
        {
            "model_url": modelHFURLPrefix + models[2]+ "-MLC/resolve/main/",
            "model_id": models[2],
            "model_lib_url": modelLibURLPrefix + models[2] + "-webgpu.wasm"
        },
        {
            "model_url": modelHFURLPrefix + models[3]+ "-MLC/resolve/main/",
            "model_id": models[3],
            "model_lib_url": modelLibURLPrefix + models[3] + "-webgpu.wasm"
        },
        {
            "model_url": modelHFURLPrefix + models[4]+ "-MLC/resolve/main/",
            "model_id": models[4],
            "model_lib_url": modelLibURLPrefix + models[4] + "-webgpu.wasm"
        }
    ],
	"use_web_worker": true
}
