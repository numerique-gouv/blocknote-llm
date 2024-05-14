import { useState } from 'react';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView, useCreateBlockNote } from '@blocknote/react';
import '@blocknote/react/style.css';
import './App.css';
import {
	ChatCompletionMessageParam,
	CreateWebWorkerEngine,
	Engine,
	EngineInterface,
	InitProgressReport,
} from '@mlc-ai/web-llm';
import ChatUI from './ChatUI';
import { transformateurJsonToString } from './utils/ParserBlockToString';
import { BlockNoteEditor } from '@blocknote/core';
import { appConfig } from './app-config';
import { MODEL_DESCRIPTIONS, Model } from '../src_v2/models';

const Demo = () => {
	const [engine, setEngine] = useState<EngineInterface | null>(null);
	const [progress, setProgress] = useState('Not loaded');
	const [test, setTest] = useState('');
	const [selectedModel, setSelectedModel] = useState<string>(
		Model.CROISSANT_LLM_CHAT_V0_1_Q4F16_1
	);
	const [isGenerating, setIsGenerating] = useState(false);
	const [disabled, setDisabled] = useState<boolean>(false);
	const [disabled2, setDisabled2] = useState<boolean>(false);
	const [translation, setTranslation] = useState<boolean>(false);
	//const [translationCount, setTranslationCount] = useState<number>(0);

	const [messages, setMessages] = useState<{ kind: string; text: string }[]>(
		[]
	);
	const [runtimeStats, setRuntimeStats] = useState('');

	const editorFrench = useCreateBlockNote();
	const editorEnglish = useCreateBlockNote({
		initialContent: editorFrench.document,
	});

	const initProgressCallback = (report: InitProgressReport) => {
		console.log(report);
		setProgress(report.text);
	};

	const loadEngine = async () => {
		console.log('Loading engine');

		const engine: EngineInterface = await CreateWebWorkerEngine(
			new Worker(new URL('./workerLlama.ts', import.meta.url), {
				type: 'module',
			}),
			selectedModel,
			{ initProgressCallback: initProgressCallback, appConfig: appConfig }
		);
		setEngine(engine);
		return engine;
	};

	type updateEditor = (
		text: string,
		editor?: BlockNoteEditor,
		idBlock?: string,
		textColor?: string
	) => void;

	const onSend = async (prompt: string, updateEditor: updateEditor) => {
		if (prompt === '') {
			return;
		}
		setIsGenerating(true);

		let loadedEngine = engine;

		const userMessage: ChatCompletionMessageParam = {
			role: 'user',
			content: prompt,
		};
		setTest('');

		if (!loadedEngine) {
			console.log('Engine not loaded');

			try {
				loadedEngine = await loadEngine();
			} catch (error) {
				setIsGenerating(false);
				console.log(error);
				setTest('Could not load the model because ' + error);
				return;
			}
		}

		try {
			const completion = await loadedEngine.chat.completions.create({
				stream: true,
				messages: [userMessage],
			});

			let assistantMessage = '';
			for await (const chunk of completion) {
				const curDelta = chunk.choices[0].delta.content;
				if (curDelta) {
					assistantMessage += curDelta;
				}
				updateEditor(assistantMessage);
			}

			setIsGenerating(false);
			setRuntimeStats(await loadedEngine.runtimeStatsText());
			console.log(await loadedEngine.runtimeStatsText());
		} catch (e) {
			setIsGenerating(false);
			console.log('EXECPTION');
			console.log(e);
			setTest('Error. Try again.');
			return;
		}
	};

	const resetChat = async () => {
		if (!engine) {
			console.log('Engine not loaded');
			return;
		}
		await engine.resetChat();
		setTest('');
	};

	const resetEngineAndChatHistory = async () => {
		if (engine) {
			await engine.unload();
		}
		setEngine(null);
		setTest('');
	};

	const onStop = () => {
		if (!engine) {
			console.log('Engine not loaded');
			return;
		}

		setIsGenerating(false);
		engine.interruptGenerate();
	};

	const translate = async () => {
		const idBlock = await duplicateEditor(editorFrench, editorEnglish);
		for (const id of idBlock) {
			const block = editorFrench.getBlock(id);
			let text = '';
			if (block) {
				text = transformateurJsonToString(block);
			}
			if (text !== '') {
				const prompt = 'Tu peux me traduire ce texte en anglais : ' + text;
				onSend(prompt, (text: string) => {
					updateBlock(editorEnglish, id, text, 'red');
				});
			}
		}
	};

	const Correction = async () => {
		const idBlocks = getEditorBlocks(editorFrench);
		for (const id of idBlocks) {
			const block = editorFrench.getBlock(id);
			let text = '';
			if (block) {
				text = transformateurJsonToString(block);
			}
			if (text !== '') {
				const prompt =
					"Je veux que tu recopies mot pour mot ce texte en corrigeant les fautes d'orthographes : " +
					text;
			}
		}
	};

	const getEditorBlocks = (editor: BlockNoteEditor) => {
		const idBlocks: string[] = [];
		editor.forEachBlock((block) => {
			const text = transformateurJsonToString(block);
			if (text !== '') {
				idBlocks.push(block.id);
			}
			return true;
		});
		return idBlocks;
	};

	const duplicateEditor = async (
		initialEditor: BlockNoteEditor,
		duplicateEditor: BlockNoteEditor
	) => {
		const idBlocks: string[] = [];
		await initialEditor.tryParseMarkdownToBlocks(''); //Fix bug
		duplicateEditor.replaceBlocks(
			duplicateEditor.document,
			initialEditor.document
		);
		initialEditor.forEachBlock((block) => {
			const text = transformateurJsonToString(block);
			if (text !== '') {
				idBlocks.push(block.id);
				duplicateEditor.updateBlock(block.id, {
					content: [
						{
							type: 'text',
							text: 'Traduction en cours ...',
							styles: { textColor: 'red' },
						},
					],
				});
			}
			return true;
		});
		return idBlocks;
	};

	const updateBlock = (
		editor: BlockNoteEditor,
		blockId: string,
		text: string,
		textColor: string
	) => {
		const block = editor.getBlock(blockId);
		if (block) {
			editor.updateBlock(blockId, {
				content: [
					{
						type: 'text',
						text: text,
						styles: { textColor: textColor },
					},
				],
			});
		}
	};

	const addBelowBlock = (
		editor: BlockNoteEditor,
		blockId: string,
		text: string
	) => {
		const block = editor.getBlock(blockId);
		if (block) {
			editor.insertBlocks(
				[
					{
						content: [
							{
								type: 'text',
								text: text,
								styles: { textColor: 'red' },
							},
						],
					},
				],
				blockId,
				'after'
			);
		}
	};

	return (
		<>
			<div>{test}</div>
			<button onClick={resetChat}>Send</button>
			<button onClick={loadEngine}>Load</button>
			<div>{progress}</div>
			<div className='chatui-select-wrapper'>
				{/* <div>
					{Object.values(Model).map((model, index) => (
						<div key={index}>
							<div>{model}</div>
							<span>'test'</span>
						</div>
					))}
				</div> */}
				<select
					id='chatui-select'
					value={selectedModel}
					onChange={(selectedModel) => {
						setSelectedModel(selectedModel.target.value as Model);
						resetEngineAndChatHistory();
					}}
				>
					{Object.values(Model).map((model) => (
						<option key={model} value={model}>
							{MODEL_DESCRIPTIONS[model].icon}{' '}
							{MODEL_DESCRIPTIONS[model].displayName}
						</option>
					))}
				</select>
			</div>
			<div className='translate-button'>
				{disabled && <p>Document en cours de traduction ...</p>}
				{disabled2 && <p>Document en cours de corrrection ...</p>}
				{runtimeStats && <p>Vitesse : {runtimeStats}</p>}
				<div style={{ display: 'flex', gap: '20px' }}>
					<button
						disabled={disabled}
						onClick={() => {
							setDisabled(true);
							setTranslation(true);
							translate();
						}}
					>
						Traduire le document
					</button>
					<button
						disabled={disabled2}
						onClick={() => {
							setDisabled2(true);
							// setTranslation(true);
							Correction();
						}}
					>
						Corriger le document
					</button>
				</div>
			</div>
			<div className='blocknote-container'>
				<BlockNoteView
					editor={editorFrench}
					className={
						translation ? 'blocknote-french' : 'blocknote-french full-width'
					}
				/>
				{translation && (
					<BlockNoteView editor={editorEnglish} className='blocknote-english' />
				)}
			</div>
		</>
	);
};
export default Demo;
