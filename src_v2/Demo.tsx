import { useState } from 'react';
import * as webllm from '@mlc-ai/web-llm';
import useChatStore from './hooks/useChatStore.ts';
import { appConfig } from '../src_v1/components/app-config.ts';

const Demo = () => {
	const [engine, setEngine] = useState<webllm.EngineInterface | null>(null);
	const [progress, setProgress] = useState('Not loaded');

	const userInput = useChatStore((state) => state.userInput);
	const setUserInput = useChatStore((state) => state.setUserInput);
	const selectedModel = useChatStore((state) => state.selectedModel);
	const setIsGenerating = useChatStore((state) => state.setIsGenerating);
	const chatHistory = useChatStore((state) => state.chatHistory);
	const setChatHistory = useChatStore((state) => state.setChatHistory);

	const systemPrompt = 'You are a very helpful assistant.';

	const initProgressCallback = (report: webllm.InitProgressReport) => {
		console.log(report);
		setProgress(report.text);
		setChatHistory((history) => [
			...history.slice(0, -1),
			{ role: 'assistant', content: report.text },
		]);
	};

	const loadEngine = async () => {
		console.log('Loading engine');

		setChatHistory((history) => [
			...history.slice(0, -1),
			{ role: 'assistant', content: 'Loading engine...' },
		]);

		const engine: webllm.EngineInterface = await webllm.CreateWebWorkerEngine(
			new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
			selectedModel,
			{ initProgressCallback: initProgressCallback, appConfig: appConfig }
		);
		setEngine(engine);
		return engine;
	};

	const onSend = async () => {
		setIsGenerating(true);

		let loadedEngine = engine;

		// Add the user message to the chat history
		const userMessage: webllm.ChatCompletionMessageParam = {
			role: 'user',
			content: userInput,
		};
		setChatHistory((history) => [
			...history,
			userMessage,
			{ role: 'assistant', content: '' },
		]);
		setUserInput('');

		// Start up the engine first
		if (!loadedEngine) {
			console.log('Engine not loaded');

			try {
				loadedEngine = await loadEngine();
			} catch (e) {
				setIsGenerating(false);
				console.error(e);
				setChatHistory((history) => [
					...history.slice(0, -1),
					{
						role: 'assistant',
						content: 'Could not load the model because ' + e,
					},
				]);
				return;
			}
		}

		try {
			const completion = await loadedEngine.chat.completions.create({
				stream: true,
				messages: [
					{ role: 'system', content: systemPrompt },
					...chatHistory,
					userMessage,
				],
				temperature: 0.5,
				max_gen_len: 1024,
			});

			// Get each chunk from the stream
			let assistantMessage = '';
			for await (const chunk of completion) {
				const curDelta = chunk.choices[0].delta.content;
				if (curDelta) {
					assistantMessage += curDelta;
					// Update the last message
					setChatHistory((history) => [
						...history.slice(0, -1),
						{ role: 'assistant', content: assistantMessage },
					]);
				}
			}

			setIsGenerating(false);

			console.log(await loadedEngine.runtimeStatsText());
		} catch (e) {
			setIsGenerating(false);
			console.error('EXCEPTION');
			console.error(e);
			setChatHistory((history) => [
				...history,
				{ role: 'assistant', content: 'Error. Try again.' },
			]);
			return;
		}
	};

	const resetChat = async () => {
		if (!engine) {
			console.error('Engine not loaded');
			return;
		}
		await engine.resetChat();
		setUserInput('');
		setChatHistory(() => []);
	};

	const resetEngineAndChatHistory = async () => {
		if (engine) {
			await engine.unload();
		}
		setEngine(null);
		setUserInput('');
		setChatHistory(() => []);
	};

	const onStop = () => {
		if (!engine) {
			console.error('Engine not loaded');
			return;
		}

		setIsGenerating(false);
		engine.interruptGenerate();
	};

	return (
		<div>
			{chatHistory.map((message, index) => (
				<p key={index}>{message}</p>
			))}
		</div>
	);
};
export default Demo;
