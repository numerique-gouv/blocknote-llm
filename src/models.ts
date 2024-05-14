export enum Model {
	LLAMA_3_8B_INSTRUCT_Q4F16_1 = 'Llama-3-8B-Instruct-q4f16_1',
	CROISSANT_LLM_CHAT_V0_1_Q4F16_1 = 'CroissantLLMChat-v0.1-q4f16_1',
	CROISSANT_LLM_CHAT_V0_1_Q4F32_1 = 'CroissantLLMChat-v0.1-q4f32_1',
	CROISSANT_LLM_CHAT_V0_1_Q0F16_1 = 'CroissantLLMChat-v0.1-q0f16',
	CROISSANT_LLM_CHAT_V0_1_Q0F32_1 = 'CroissantLLMChat-v0.1-q0f32',
}

export const MODEL_DESCRIPTIONS: {
	[key in Model]: { displayName: string; icon: string };
} = {
	'Llama-3-8B-Instruct-q4f16_1': {
		displayName: 'Llama3',
		icon: '🦙',
	},
	'CroissantLLMChat-v0.1-q4f16_1': {
		displayName: 'CroissantLLM Q4F16',
		icon: '🥐',
	},
	'CroissantLLMChat-v0.1-q4f32_1': {
		displayName: 'CroissantLLM Q4F32',
		icon: '🥐',
	},
	'CroissantLLMChat-v0.1-q0f16': {
		displayName: 'CroissantLLM Q0F16',
		icon: '🥐',
	},
	'CroissantLLMChat-v0.1-q0f32': {
		displayName: 'CroissantLLM Q0F32',
		icon: '🥐',
	},
};
