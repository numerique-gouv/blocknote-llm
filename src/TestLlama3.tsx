import { useState } from 'react';
import * as webllm from '@mlc-ai/web-llm';
import './App.css';

const TestLlama3 = () => {
	const [input, setInput] = useState<string>('');
	const [text, setText] = useState<string>('');
	const [loading, setLoading] = useState<string>('');
	const [disabled, setDisabled] = useState<boolean>(false);

	async function main() {
		setDisabled(true);
		setText('');
		setLoading('');
		const initProgressCallback = (report: webllm.InitProgressReport) => {
			setLoading(report.text);
		};
		const selectedModel = 'Llama-3-8B-Instruct-q4f32_1';
		const engine: webllm.EngineInterface = await webllm.CreateWebWorkerEngine(
			new Worker(new URL('./workerLlama.ts', import.meta.url), {
				type: 'module',
			}),
			selectedModel,
			{ initProgressCallback: initProgressCallback }
		);
		const reply0 = await engine.chat.completions.create({
			stream: true,
			messages: [{ role: 'user', content: input }],
		});
		for await (const chunk of reply0) {
			const curlDelta = chunk.choices[0].delta.content;
			if (curlDelta) {
				setText((prev) => prev + curlDelta);
			}
		}
		console.log(await engine.runtimeStatsText());
		console.log(await engine.getMessage());
		setDisabled(false);
	}

	return (
		<div className='textbox-container'>
			<textarea
				value={input}
				rows={20}
				onChange={(e) => setInput(e.target.value)}
			></textarea>
			<div>{loading}</div>
			<div>{text}</div>
			<button onClick={main} disabled={disabled}>
				Générer
			</button>
		</div>
	);
};
export default TestLlama3;
