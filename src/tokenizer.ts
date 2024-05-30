import {
	ChatCompletionSystemMessageParam,
	ChatCompletionUserMessageParam,
} from '@mlc-ai/web-llm';
import { AutoTokenizer } from '@xenova/transformers';

export const checkInputLength = async (
	chat: (ChatCompletionSystemMessageParam | ChatCompletionUserMessageParam)[]
): Promise<boolean> => {
	const tokenizer = await AutoTokenizer.from_pretrained('/models');

	const input_ids = tokenizer.apply_chat_template(chat, {
		tokenize: true,
		return_tensor: false,
	});

	return input_ids.length > 7000;
};
