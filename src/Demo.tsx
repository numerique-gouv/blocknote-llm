import { useEffect, useState } from 'react';
import '@blocknote/core/fonts/inter.css';
import {
	BlockNoteView,
	useCreateBlockNote,
	FormattingToolbar,
	FormattingToolbarController,
	BlockTypeSelect,
	ImageCaptionButton,
	ReplaceImageButton,
	BasicTextStyleButton,
	TextAlignButton,
	ColorStyleButton,
	NestBlockButton,
	UnnestBlockButton,
	CreateLinkButton,
} from '@blocknote/react';
import '@blocknote/react/style.css';
import './App.css';
import {
	ChatCompletionMessageParam,
	CreateWebWorkerEngine,
	EngineInterface,
	InitProgressReport,
	hasModelInCache,
} from '@mlc-ai/web-llm';
import { transformateurJsonToString } from './utils/ParserBlockToString';
import { BlockNoteEditor } from '@blocknote/core';
import { CustomFormattingToolbar } from './components/CustomFormattingToolbar';
import { appConfig } from './app-config';
import { MODEL_DESCRIPTIONS, Model } from './models';
import {
	addBlock,
	duplicateEditor,
	getEditorBlocks,
	updateBlock,
} from './utils/blockManipulation';
import correctSingleBlock from './utils/correctSingleBlock';

const Demo = () => {
	const [engine, setEngine] = useState<EngineInterface | null>(null);
	const [progress, setProgress] = useState('Not loaded');
	const [test, setTest] = useState('');
	const [selectedModel, setSelectedModel] = useState<string>(
		Model.CROISSANT_LLM_CHAT_V0_1_Q4F16_1
	);
	const [isGenerating, setIsGenerating] = useState(false);
	const [currentProccess, setCurrentProcess] = useState<
		'translation' | 'correction' | 'resume' | null
	>(null);
	const [translation, setTranslation] = useState<boolean>(false);

	const [runtimeStats, setRuntimeStats] = useState('');

	const [modelsState, setModelsState] = useState<{ [key: string]: boolean }>(
		{}
	);

	const IS_MODEL_STATUS_CHECK_ENABLED = false;

	const updateModelStatus = async () => {
		console.log('Checking model status');
		Object.values(Model).forEach(async (model) => {
			const isInCache = await hasModelInCache(model, appConfig);
			console.log(`${model} in cache: ${isInCache}`);
			setModelsState((prev) => ({
				...prev,
				[model]: isInCache,
			}));
		});
	};

	useEffect(() => {
		if (IS_MODEL_STATUS_CHECK_ENABLED) {
			updateModelStatus();
		}
	}, []);

	const editorFrench = useCreateBlockNote();
	const editorEnglish = useCreateBlockNote({
		initialContent: editorFrench.document,
	});

	const initProgressCallback = (report: InitProgressReport) => {
		//console.log(report);
		setProgress(report.text);
	};

	const loadEngine = async () => {
		console.log('Loading engine');

		const engine: EngineInterface = await CreateWebWorkerEngine(
			new Worker(new URL('./worker.ts', import.meta.url), {
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

	const onSend = async (
		loadedEngine: EngineInterface,
		prompt: string,
		updateEditor: updateEditor
	) => {
		if (prompt === '') {
			return;
		}
		setIsGenerating(true);

		const userMessage: ChatCompletionMessageParam = {
			role: 'user',
			content: prompt,
		};
		setTest('');

		// if (!loadedEngine) {
		// 	console.log('Engine not loaded');

		// 	try {
		// 		loadedEngine = await loadEngine();
		// 	} catch (error) {
		// 		setIsGenerating(false);
		// 		console.log(error);
		// 		setTest('Could not load the model because ' + error);
		// 		return;
		// 	}
		// }

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
			const text = await loadedEngine.getMessage();
			setIsGenerating(false);
			setCurrentProcess(null);
			setRuntimeStats(await loadedEngine.runtimeStatsText());
			console.log(await loadedEngine.runtimeStatsText());
			return text;
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
		let loadedEngine = engine;
		const idBlock = await duplicateEditor(
			editorFrench,
			editorEnglish,
			'Traduction en cours…'
		);
		for (const id of idBlock) {
			const block = editorFrench.getBlock(id);
			let text = '';
			if (block) {
				text = transformateurJsonToString(block);
			}
			if (text !== '') {
				setIsGenerating(true);
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
				const prompt = 'Tu peux me traduire ce texte en anglais : ' + text;
				await onSend(loadedEngine, prompt, (text: string) => {
					updateBlock(editorEnglish, id, text, 'red');
				});
			}
		}
	};

	const Correction = async () => {
		const idBlocks = await duplicateEditor(
			editorFrench,
			editorEnglish,
			'Correction en cours…'
		);
		for (const id of idBlocks) {
			const block = editorFrench.getBlock(id);
			let text = '';
			if (block) {
				text = transformateurJsonToString(block);
			}
			if (text !== '') {
				await correctSingleBlock(
					block,
					editorEnglish.getBlock(id),
					editorFrench,
					editorEnglish,
					onSend
				);
				// const prompt =
				// 	"Je veux que tu recopies mot pour mot ce texte en corrigeant les fautes d'orthographes : " +
				// 	text;
				// await onSend(prompt, (text: string) =>
				// 	updateBlock(editorEnglish, id, text, 'red')
				// );
			}
		}
	};

	const Resume = async () => {
		const idBlocks = getEditorBlocks(editorFrench).reverse();
		console.log('test');
		let texte3 = '';
		let titre1 = '';
		let titre2 = '';
		let titre3 = '';
		let texte2 = '';
		let texte1 = '';
		let text = '';

		for (const id of idBlocks) {
			const block = editorFrench.getBlock(id);
			if (block) {
				if (block.type === 'heading') {
					if (block.props.level === 3) {
						titre3 = transformateurJsonToString(block);
						if (texte3 !== '') {
							const prompt =
								' Résume ce texte si besoin: ' +
								texte3 +
								" sachant que c'est une sous-partie de :" +
								titre3;
							const res = await onSend(prompt, (text: string) => {});

							texte2 += res;
						}
					} else if (block.props.level === 2) {
						if (texte2 + texte3 !== '') {
							titre2 = transformateurJsonToString(block);
							const prompt =
								' Résume ce texte si besoin: ' +
								texte2 +
								texte3 +
								" sachant que c'est une sous-partie de :" +
								titre2;
							const res = await onSend(prompt, (text: string) => {});
							texte1 += res;

							texte2 = '';
							texte3 = '';
						}
					} else if (block.props.level === 1) {
						if (texte1 + texte2 + texte3 !== '') {
							titre1 = transformateurJsonToString(block);
							const prompt =
								' Résume ce texte si besoin: ' +
								texte1 +
								texte2 +
								texte3 +
								" sachant que c'est une sous-partie de :" +
								titre1;
							const res = await onSend(prompt, (text: string) => {});
							text = res;

							texte1 = '';
							texte2 = '';
							texte3 = '';
						}
					}
				} else {
					texte3 = transformateurJsonToString(block) + texte3;
				}
			}
		}
		if (text + texte1 + texte2 + texte3 !== '') {
			const prompt =
				' Résume ce texte si besoin: ' + text + texte1 + texte2 + texte3;
			const res = await onSend(prompt, (text: string) => {});
			console.log(res);
			if (res) {
				addBlock(
					editorFrench,
					idBlocks[idBlocks.length - 1],
					'Voici le résumé du document : ' + res,
					'red',
					'before'
				);
			}
			return text + texte1 + texte2 + texte3;
		}
	};

	return (
		<>
			<div>{test}</div>
			{/* <button onClick={resetChat}>Send</button> */}

			{/*<div>
				{Object.values(Model).map((model, index) => (
					<div key={index}>
						<div>{model}</div>
						<span>{modelsState[model] ? 'Cached' : 'Not Cached'}</span>
					</div>
				))}
				</div>*/}
			<div className='chatui-select-wrapper'>
				<select
					id='chatui-select'
					value={selectedModel}
					onChange={(selectedModel) => {
						setSelectedModel(selectedModel.target.value as Model);
						// resetEngineAndChatHistory();
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
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: '20px',
					marginBottom: '20px',
				}}
			>
				<button onClick={loadEngine}>Load</button>
				<div>{progress}</div>
			</div>
			<div className='translate-button'>
				{currentProccess === 'translation' && (
					<p>Document en cours de traduction…</p>
				)}
				{currentProccess === 'correction' && (
					<p>Document en cours de corrrection…</p>
				)}
				{runtimeStats && <p>Vitesse : {runtimeStats}</p>}
				<div style={{ display: 'flex', gap: '20px' }}>
					<button
						disabled={currentProccess !== null}
						onClick={() => {
							setCurrentProcess('translation');
							setTranslation(true);
							translate();
						}}
					>
						Traduire le document
					</button>
					<button
						disabled={currentProccess !== null}
						onClick={() => {
							setCurrentProcess('correction');
							setTranslation(true);
							// setTranslation(true);
							Correction();
						}}
					>
						Corriger le document
					</button>
					<button
						disabled={currentProccess !== null}
						onClick={() => {
							setCurrentProcess('resume');
							Resume();
						}}
					>
						Resumer le document
					</button>
				</div>
			</div>
			<div className='blocknote-container'>
				<BlockNoteView
					editor={editorFrench}
					className={
						translation ? 'blocknote-french' : 'blocknote-french full-width'
					}
					formattingToolbar={false}
				>
					<FormattingToolbarController
						formattingToolbar={() => (
							<CustomFormattingToolbar onSend={onSend} />
						)}
					/>
				</BlockNoteView>
				{translation && (
					<BlockNoteView editor={editorEnglish} className='blocknote-english' />
				)}
			</div>
		</>
	);
};
export default Demo;
