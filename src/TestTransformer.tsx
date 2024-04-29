import { useState } from 'react';
import {
	pipeline,
	env,
	AutoTokenizer,
	AutoModelForCausalLM,
} from '@xenova/transformers';
import { InferenceSession, Tensor } from 'onnxruntime-web';
import './App.css';

const TestTransformer = () => {
	const [prompt, setPrompt] = useState<string>('');

	env.allowLocalModels = true;
	env.allowRemoteModels = false;
	env.localModelPath = '/src/model/';

	async function main() {
		const session = await InferenceSession.create(
			'/src/model/CroissantLLMChat-v0.1/onnx/model_quantized.onnx',
			{ executionProviders: ['wasm'] }
		);
		const tokenizer = await AutoTokenizer.from_pretrained(
			'/CroissantLLMChat-v0.1'
		);

		const dataA = Float64Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
		const dataB = Float64Array.from([
			10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120,
		]);
		const tensorA = new Tensor('float64', dataA, [3, 4]);
		const tensorB = new Tensor('float64', dataB, [4, 3]);

		const conversation = [{ role: 'user', content: prompt }];
		const test = tokenizer.apply_chat_template(conversation, {
			tokenize: false,
			add_generation_prompt: true,
		});
		const token = tokenizer(test, {
			return_tensors: 'pt',
			add_special_tokens: true,
		});
		console.log(token);

		const feeds = {
			input_ids: token.input_ids,
			attention_mask: token.attention_mask,
			position_ids: token.input_ids,
		};

		const results = await session.run(feeds);
		const dataC = results.c.data;
		console.log(dataC);

		console.log('✅ Tokenizer is correctly loaded: \n', tokenizer);
		const input = tokenizer.encode('Hello, how are you?');
		const decode = tokenizer.decode(input, { skip_special_tokens: true });
		console.log('✅ Tokenizer correctly encodes input: \n', decode);
		console.log('whesh');
		//const generator = await pipeline('text-generation', '/CroissantLLMChat-v0.1');
		// const output = await generator('What can I visit in Paris today', {
		// 	add_special_tokens: true,
		// 	max_new_tokens: 100,
		// 	repetition_penalty: 1.2,
		// });
		//console.log(output[0].generated_text);
	}
	return (
		<div className='textbox-container'>
			<textarea
				value={prompt}
				rows={20}
				onChange={(e) => setPrompt(e.target.value)}
			></textarea>
			<button onClick={main}>Générer</button>
		</div>
	);
};
export default TestTransformer;
