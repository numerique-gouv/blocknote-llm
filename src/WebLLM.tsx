import './WebLLM.css';
import { useEffect, useState } from 'react';
import { appConfig } from './app-config';
import * as webllm from '@mlc-ai/web-llm';

interface Message {
	role: string;
	content: string;
}

const WebLLM = () => {
	const engine = new webllm.WebWorkerEngine(
		new Worker(new URL('./workerLlama.ts', import.meta.url), { type: 'module' })
	);

	const [modelsList, setModelsList] = useState<string[]>([]);
	const [selectedModel, setSelectedModel] = useState<string>('');
	const [chatLoaded, setChatLoaded] = useState<boolean>(false);
	const [requestInProgress, setRequestInProgress] = useState<boolean>(false);
	const [loading, setLoading] = useState<string>('');
	const [prompt, setPrompt] = useState<string>('');
	const [output, setOutput] = useState<string>('');
	const [info, setInfo] = useState<string>('');
	const [error, setError] = useState<string>('');
	const [messages, setMessages] = useState<Message[]>([
		{ role: 'init', content: '' },
	]);
	const [placeholder, setPlaceholder] = useState<string>(
		'Enter your message...'
	);
	let chatRequestChain: Promise<void> = Promise.resolve();

	const CreateAsync = async () => {
		const androidMaxStorageBufferBindingSize = 1 << 27; // 128MB
		const mobileVendors = new Set<string>(['qualcomm', 'arm']);
		//let restrictModels = false;
		let maxStorageBufferBindingSize: number;
		let gpuVendor: string;
		try {
			[maxStorageBufferBindingSize, gpuVendor] = await Promise.all([
				engine.getMaxStorageBufferBindingSize(),
				engine.getGPUVendor(),
			]);
		} catch (err) {
			console.log(err.stack);
			return;
		}
		if (
			(gpuVendor.length != 0 && mobileVendors.has(gpuVendor)) ||
			maxStorageBufferBindingSize <= androidMaxStorageBufferBindingSize
		) {
			//restrictModels = true;
			console.log('Restricting models');
		}

		const models: string[] = [];

		for (const item of appConfig.model_list) {
			models.push(item.model_id);
		}
		setModelsList(models);
		setSelectedModel(models[0]);
	};

	useEffect(() => {
		CreateAsync();
	}, []);

	const onSelectChange = (
		modelSelector: React.ChangeEvent<HTMLSelectElement>
	) => {
		if (requestInProgress) {
			engine.interruptGenerate();
		}
		pushTask(async () => {
			await engine.resetChat();
			await unloadChat();
			setSelectedModel(modelSelector.target.value);
			await asyncInitChat();
		});
	};

	const unloadChat = async () => {
		await engine.unload();
		setChatLoaded(false);
	};

	const asyncInitChat = async () => {
		if (chatLoaded) {
			return;
		}
		setRequestInProgress(true);
		const initProgressCallback = (report: webllm.InitProgressReport) => {
			updateLastMessage('init', '[System Initialize] ' + report.text);
		};
		engine.setInitProgressCallback(initProgressCallback);
		console.log('Selected model:', selectedModel);
		try {
			await engine.reload(selectedModel, undefined, appConfig);
		} catch (err) {
			setMessages((prevMessages) => [
				...prevMessages,
				{ role: 'error', content: 'Init error, ' + err.toString() },
			]);
			console.log(err.stack);
			unloadChat();
			setRequestInProgress(false);
			return;
		}
		setRequestInProgress(false);
		setChatLoaded(true);
	};

	const onReset = async () => {
		if (requestInProgress) {
			engine.interruptGenerate();
		}
		pushTask(async () => {
			await engine.resetChat();
		});
	};

	const pushTask = (task: () => Promise<void>) => {
		const lastEvent = chatRequestChain;
		chatRequestChain = lastEvent.then(task);
	};

	const onGenerate = async () => {
		if (requestInProgress) {
			return;
		}
		pushTask(async () => {
			await asyncGenerate();
		});
	};

	const updateLastMessage = async (type: string, message: string) => {
		const index = messages
			.slice()
			.reverse()
			.findIndex((msg) => msg.role === type);
		if (index !== -1) {
			const updatedMessages = [...messages];
			updatedMessages[messages.length - 1 - index].content = message;
			setMessages(updatedMessages);
		}
	};

	const asyncGenerate = async () => {
		await asyncInitChat();
		setRequestInProgress(true);
		if (prompt == '') {
			setRequestInProgress(false);
			return;
		}
		setMessages((prevMessages) => [
			...prevMessages,
			{ role: 'user', content: prompt },
		]);
		setPrompt('');
		setPlaceholder('Generating...');
		setMessages((prevMessages) => [
			...prevMessages,
			{ role: 'ia', content: '' },
		]);
		try {
			let curlMessage = '';
			const completion = await engine.chat.completions.create({
				stream: true,
				messages: [{ role: 'user', content: prompt }],
			});
			for await (const chunk of completion) {
				const curlDelta = chunk.choices[0].delta.content;
				if (curlDelta) {
					curlMessage += curlDelta;
				}
				setMessages((prevMessages) => {
					const updatedMessages = [...prevMessages];
					const index = updatedMessages
						.slice()
						.reverse()
						.findIndex((msg) => msg.role === 'ia');
					if (index !== -1) {
						updatedMessages[prevMessages.length - 1 - index].content =
							curlMessage;
					}
					return updatedMessages;
				});
			}
			setInfo(await engine.runtimeStatsText());
			const finalMessage = await engine.getMessage();
			updateLastMessage('ia', finalMessage);
		} catch (err) {
			setMessages((prevMessages) => [
				...prevMessages,
				{ role: 'error', content: 'Generate error, ' + err.toString() },
			]);
			console.log(err);
			await unloadChat();
		}
		setPlaceholder('Enter your message...');
		setRequestInProgress(false);
	};

	return (
		<>
			<div className='chatui'>
				<div className='chatui-select-wrapper'>
					<select id='chatui-select' onChange={onSelectChange}>
						{modelsList.map((model) => (
							<option key={model} value={model}>
								{model}
							</option>
						))}
					</select>
				</div>
				<div className='chatui-chat' id='chatui-chat'>
					{messages.map((msg, index) => {
						return (
							msg.content !== '' && (
								<div key={index} className={`msg ${msg.role}-msg`}>
									<div className='msg-bubble'>
										<div className='msg-text'>{msg.content}</div>
									</div>
								</div>
							)
						);
					})}
				</div>

				<div className='chatui-inputarea'>
					<input
						id='chatui-input'
						type='text'
						value={prompt}
						className='chatui-input'
						placeholder={placeholder}
						onChange={(e) => setPrompt(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								onGenerate();
							}
						}}
					/>
					<button
						id='chatui-send-btn'
						className='chatui-send-btn'
						onClick={onGenerate}
					></button>
					<button
						id='chatui-reset-btn'
						className='chatui-reset-btn'
						onClick={onReset}
					></button>
				</div>
			</div>

			<div className='chatui-extra-control'>
				<label id='chatui-info-label'>{info}</label>
			</div>
			<div>
				{messages.map((message, index) => (
					<div key={index}>{message.content}</div>
				))}
			</div>
		</>
	);
};
export default WebLLM;
