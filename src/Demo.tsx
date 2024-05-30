import { useEffect, useState } from 'react';
import '@blocknote/core/fonts/inter.css';
import {
	BlockNoteView,
	useCreateBlockNote,
	FormattingToolbarController,
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
import { Block, BlockNoteEditor } from '@blocknote/core';
import { CustomFormattingToolbar } from './components/CustomFormattingToolbar';
import { appConfig } from './app-config';
import { MODEL_DESCRIPTIONS, Model } from './models';
import {
	addBlock,
	duplicateEditor,
	getEditorBlocks,
	updateBlock,
	updateContentBlock,
} from './utils/blockManipulation';
import correctSingleBlock from './utils/correctSingleBlock';
import diffText from './utils/diffText';
import { systemPrompt } from './prompt';
import { ActionIcon, Button, Tooltip } from '@mantine/core';
import Progress from './components/Progress';
import { IconPlayerStop, IconTrash } from '@tabler/icons-react';
import { AutoTokenizer, PreTrainedTokenizer, env } from '@xenova/transformers';
import { checkInputLength } from './tokenizer';

declare global {
	interface Window {
		chrome?: any;
	}
}
env.localModelPath = '/blocknote-llm/';

const Demo = () => {
	const selectedModel = 'Llama-3-8B-Instruct-q4f16_1';
	const [engine, setEngine] = useState<EngineInterface | null>(null);
	const [progress, setProgress] = useState('Not loaded');
	const [progressPercentage, setProgressPercentage] = useState(0);
	const [isFecthing, setIsFetching] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [runtimeStats, setRuntimeStats] = useState('');
	const [modelInCache, setModelInCache] = useState<boolean | null>(null);
	const [showSecondEditor, setShowSecondEditor] = useState<boolean>(false);
	const [errorBrowserMessage, setErrorBrowserMessage] = useState<string | null>(
		null
	);
	const [error, setError] = useState<string | null>(null);
	const [currentProccess, setCurrentProcess] = useState<
		'translation' | 'correction' | 'resume' | 'developpe' | null
	>(null);

	const [output, setOutput] = useState<string>('');

	const loadingMessage = {
		translation: 'Document en cours de traduction. Génération de la réponse...',
		correction: 'Document en cours de correction. Génération de la réponse...',
		resume: 'Résumé du document en cours. Génération de la réponse...',
		developpe:
			'Développement du document en cours. Génération de la réponse...',
	};

	useEffect(() => {
		const compatibleBrowser = checkBrowser();
		checkModelInCache();
		if (!engine && compatibleBrowser) {
			loadEngine();
		}
	}, []);

	const mainEditor = useCreateBlockNote();
	const secondEditor = useCreateBlockNote({
		initialContent: mainEditor.document,
	});

	const checkBrowser = () => {
		const userAgent = navigator.userAgent;
		let compatibleBrowser = true;

		const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(
			userAgent
		);

		if (isMobile) {
			setErrorBrowserMessage(
				'Les téléphones mobiles ne sont pas compatibles avec WebGPU.'
			);
			compatibleBrowser = false;
		} else if (/firefox|fxios/i.test(userAgent)) {
			setErrorBrowserMessage("Firefox n'est pas compatible avec WebGPU.");
			compatibleBrowser = false;
		} else if (
			/safari/i.test(userAgent) &&
			!/chrome|crios|crmo/i.test(userAgent)
		) {
			setErrorBrowserMessage("Safari n'est pas compatible avec WebGPU.");
			compatibleBrowser = false;
		} else if (!window.chrome) {
			setErrorBrowserMessage(
				"Votre navigatuer n'est pas compatible avec WebGPU."
			);
			compatibleBrowser = false;
		}
		return compatibleBrowser;
	};

	const initProgressCallback = (report: InitProgressReport) => {
		//console.log(report);
		if (
			modelInCache === true ||
			report.text.startsWith('Loading model from cache')
		) {
			setOutput('Chargement du modèle dans la RAM...');
		} else {
			setOutput(
				'Téléchargement des points du modèle dans le cache de votre navigateur, cela peut prendre quelques minutes.'
			);
		}
		if (report.progress !== 0) {
			setProgressPercentage(report.progress);
		}
		if (report.progress === 1) {
			setProgressPercentage(0);
			setOutput('');
		}
		setProgress(report.text);
	};

	//const loadTokenizer = async () => {
	// 	const tokenizer = await AutoTokenizer.from_pretrained('/models');
	// 	setTokenizer(tokenizer);
	// };

	const loadEngine = async () => {
		console.log('Loading engine');
		setIsFetching(true);
		setOutput('Chargement du modèle...');

		const engine: EngineInterface = await CreateWebWorkerEngine(
			new Worker(new URL('./worker.ts', import.meta.url), {
				type: 'module',
			}),
			selectedModel,
			{
				initProgressCallback: initProgressCallback,
				appConfig: appConfig,
				chatOpts: { max_gen_len: 4096 },
			}
		);
		setIsFetching(false);
		setEngine(engine);
		const isInCache = await hasModelInCache(selectedModel, appConfig);
		setModelInCache(isInCache);
		return engine;
	};

	type updateEditor = (
		text: string,
		editor?: BlockNoteEditor,
		idBlock?: string,
		textColor?: string
	) => void;

	const onSend = async (
		prompt: string,
		task: 'translation' | 'correction' | 'resume' | 'developpe',
		updateEditor: updateEditor
	) => {
		if (prompt === '') {
			return;
		}
		setOutput(loadingMessage[task]);

		let loadedEngine = engine;

		loadedEngine = await ensureEngineLoaded(loadedEngine);

		const systemMessage: ChatCompletionMessageParam = {
			role: 'system',
			content: systemPrompt[task],
		};

		console.log('Prompt: ' + prompt);

		const userMessage: ChatCompletionMessageParam = {
			role: 'user',
			content: prompt,
		};

		const chat = [systemMessage, userMessage];

		if (await checkInputLength(chat)) {
			setError(
				'Le texte de ce bloc est trop long. Veuillez raccourcir le texte ou le séparer en plusieurs blocs.'
			);
			return;
		}

		try {
			console.log(systemMessage);
			await loadedEngine.resetChat();
			const completion = await loadedEngine.chat.completions.create({
				stream: true,
				messages: chat,
			});

			let assistantMessage = '';
			for await (const chunk of completion) {
				const curDelta = chunk.choices[0].delta.content;
				if (curDelta) {
					assistantMessage += curDelta;
					updateEditor(assistantMessage);
				}
			}
			const text = await loadedEngine.getMessage();

			setRuntimeStats(await loadedEngine.runtimeStatsText());
			console.log(await loadedEngine.runtimeStatsText());
			return text;
		} catch (e) {
			console.log('EXECPTION');
			console.log(e);
			setOutput('Error. Please try again.');
			return;
		}
	};

	const reset = async () => {
		if (!engine) {
			console.log('Engine not loaded');
			return;
		}
		await engine.resetChat();
		mainEditor.removeBlocks(mainEditor.document);
		secondEditor.removeBlocks(secondEditor.document);
		setShowSecondEditor(false);
		setOutput('');
		setError(null);
	};

	const onStop = () => {
		if (!engine) {
			console.log('Engine not loaded');
			return;
		}

		setIsGenerating(false);
		setCurrentProcess(null);
		setOutput('');
		engine.interruptGenerate();
	};

	const checkModelInCache = async () => {
		const isInCache = await hasModelInCache(selectedModel, appConfig);
		setModelInCache(isInCache);
		console.log(`${selectedModel} in cache: ${isInCache}`);
	};

	const removeNestedBlocks = async () => {
		const markdownContent = await mainEditor.blocksToMarkdownLossy(
			mainEditor.document
		);
		const editorWithoutNestedBlocks = await mainEditor.tryParseMarkdownToBlocks(
			markdownContent
		);
		mainEditor.replaceBlocks(mainEditor.document, editorWithoutNestedBlocks);
	};

	const ensureEngineLoaded = async (currentEngine: EngineInterface | null) => {
		if (currentEngine) {
			console.log('Engine loaded');
			return currentEngine;
		}

		console.log('Engine not loaded');
		try {
			const loadedEngine = await loadEngine();
			return loadedEngine;
		} catch (error) {
			setIsGenerating(false);
			console.log(error);
			setOutput('Could not load the model because ' + error);
			throw new Error('Could not load the model because ' + error);
		}
	};

	const translate = async () => {
		if (errorBrowserMessage) {
			return;
		}
		setCurrentProcess('translation');
		setShowSecondEditor(true);
		setIsGenerating(true);
		await removeNestedBlocks();
		const idBlock = await duplicateEditor(
			mainEditor,
			secondEditor,
			'Traduction en cours…',
			'red'
		);

		for (const id of idBlock) {
			const mainBlock = mainEditor.getBlock(id);
			const secondBlock = secondEditor.getBlock(id);
			let text = '';
			if (mainBlock) {
				text = transformateurJsonToString(mainBlock);
			}
			const markdownText = await mainEditor.blocksToMarkdownLossy([mainBlock]);
			if (text !== '') {
				const prompt =
					'Translate this text to English and keep the markdown formatting : ' +
					markdownText;
				await onSend(prompt, 'translation', async (translatedText: string) => {
					const translatedBlocks = await secondEditor.tryParseMarkdownToBlocks(
						translatedText
					);
					const translatedContent = translatedBlocks[0].content;
					secondEditor.updateBlock(secondBlock, { content: translatedContent });
					// updateBlock(editorEnglish, id, translatedText, 'red');
				});
			}
		}
		setCurrentProcess(null);
		setIsGenerating(false);
		setOutput('');
	};

	const correction = async () => {
		if (errorBrowserMessage) {
			return;
		}
		setCurrentProcess('correction');
		setShowSecondEditor(true);
		setIsGenerating(true);
		await removeNestedBlocks();
		const idBlocks = await duplicateEditor(
			mainEditor,
			secondEditor,
			'Correction en cours…',
			'blue'
		);

		for (const id of idBlocks) {
			const block = mainEditor.getBlock(id);
			let text = '';
			if (block) {
				text = transformateurJsonToString(block);
			}
			if (text !== '') {
				await correctSingleBlock(
					block,
					secondEditor.getBlock(id),
					mainEditor,
					secondEditor,
					onSend
				);
			}
		}
		setIsGenerating(false);
		setCurrentProcess(null);
		setOutput('');
	};

	const resume = async () => {
		if (errorBrowserMessage) {
			return;
		}
		setCurrentProcess('resume');
		setIsGenerating(true);
		await removeNestedBlocks();
		const idBlocks = getEditorBlocks(mainEditor).reverse();
		let texte3 = '';
		let titre1 = '';
		let titre2 = '';
		let titre3 = '';
		let texte2 = '';
		let texte1 = '';
		let text = '';
		addBlock(
			mainEditor,
			idBlocks[idBlocks.length - 1],
			'Résumé en cours…',
			'blue',
			'before',
			'New block resume'
		);

		for (const id of idBlocks) {
			const block = mainEditor.getBlock(id);
			if (block) {
				if (block.type === 'heading') {
					if (block.props.level === 3) {
						titre3 = transformateurJsonToString(block);
						if (texte3 !== '') {
							const prompt =
								' Résume ce texte si besoin: ' +
								texte3 +
								"\nSachant que c'est une sous-partie de : " +
								titre3;
							const res = await onSend(prompt, 'resume', (text: string) => {
								updateBlock(
									mainEditor,
									'New block resume',
									'Résumé intermédiaire : ' + text,
									'blue'
								);
							});
							texte2 += res;
						}
					} else if (block.props.level === 2) {
						if (texte2 + texte3 !== '') {
							titre2 = transformateurJsonToString(block);
							const prompt =
								' Résume ce texte si besoin: ' +
								texte2 +
								texte3 +
								"\nSachant que c'est une sous-partie de : " +
								titre2;
							const res = await onSend(prompt, 'resume', (text: string) => {
								updateBlock(
									mainEditor,
									'New block resume',
									'Résumé intermédiaire : ' + text,
									'blue'
								);
							});
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
								"\nSachant que c'est une sous-partie de : " +
								titre1;
							const res = await onSend(prompt, 'resume', (text: string) => {
								updateBlock(
									mainEditor,
									'New block resume',
									'Résumé intermédiaire : ' + text,
									'blue'
								);
							});
							text = res ?? '';

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
			const res = await onSend(prompt, 'resume', (text: string) => {
				updateBlock(mainEditor, 'New block resume', text, 'blue');
			});

			if (res) {
				const blocks = await mainEditor.tryParseMarkdownToBlocks(res);
				for (const block of blocks) {
					block.props.textColor = 'blue';
				}
				mainEditor.replaceBlocks(['New block resume'], blocks);
			}
		}
		setIsGenerating(false);
		setCurrentProcess(null);
		setOutput('');
	};

	const developpe = async () => {
		if (errorBrowserMessage) {
			return;
		}
		setCurrentProcess('developpe');
		setIsGenerating(true);
		await removeNestedBlocks();

		const idBlocks = getEditorBlocks(mainEditor);
		addBlock(
			mainEditor,
			idBlocks[idBlocks.length - 1],
			'',
			'blue',
			'after',
			'New block development'
		);
		let text = '';
		let res;
		for (const id of idBlocks) {
			const block = mainEditor.getBlock(id);
			if (block) {
				text += transformateurJsonToString(block);
			}
		}
		if (text !== '') {
			const prompt = 'Développe un texte à partir de ces éléments : ' + text;
			res = await onSend(prompt, 'developpe', async (text: string) => {
				updateBlock(mainEditor, 'New block development', text, 'blue');
			});
		}
		if (res) {
			const blocks = await mainEditor.tryParseMarkdownToBlocks(res);
			for (const block of blocks) {
				block.props.textColor = 'blue';
			}
			mainEditor.replaceBlocks(['New block development'], blocks);
		}
		setIsGenerating(false);
		setCurrentProcess(null);
		setOutput('');
	};

	return (
		<>
			<div className='reset-button'>
				<Tooltip label='Effacer'>
					<ActionIcon
						variant='default'
						color='black'
						size='xl'
						data-disabled={isFecthing || isGenerating}
						loading={isFecthing}
						onClick={reset}
					>
						<IconTrash style={{ width: '70%', height: '70%' }} />
					</ActionIcon>
				</Tooltip>
				<Tooltip label='Arrêter la génération'>
					<ActionIcon
						variant='default'
						color='black'
						size='xl'
						data-disabled={!isGenerating}
						loading={isFecthing}
						onClick={onStop}
					>
						<IconPlayerStop style={{ width: '70%', height: '70%' }} />
					</ActionIcon>
				</Tooltip>
			</div>
			<div className='header-container'>
				<h1>BlockNoteLLM</h1>

				<div className='button-container'>
					<Tooltip label="Traduis l'ensemble du document dans un nouveau bloc note">
						<Button
							variant='light'
							color='black'
							onClick={translate}
							disabled={isGenerating || isFecthing}
							loading={isFecthing || currentProccess === 'translation'}
						>
							Traduire le document
						</Button>
					</Tooltip>
					<Tooltip label="Corrige l'ensemble du document dans un nouveau bloc note">
						<Button
							variant='light'
							color='black'
							onClick={correction}
							disabled={isGenerating || isFecthing}
							loading={isFecthing || currentProccess === 'correction'}
						>
							Corriger le document
						</Button>
					</Tooltip>
					<Tooltip label="Résume l'ensemble du document">
						<Button
							variant='light'
							color='black'
							onClick={resume}
							disabled={isGenerating || isFecthing}
							loading={isFecthing || currentProccess === 'resume'}
						>
							Résumer le document
						</Button>
					</Tooltip>
					<Tooltip label='Génére un texte à partir de bullet points'>
						<Button
							variant='light'
							color='black'
							onClick={developpe}
							disabled={isGenerating || isFecthing}
							loading={isFecthing || currentProccess === 'developpe'}
						>
							Développer le document
						</Button>
					</Tooltip>
				</div>

				{errorBrowserMessage && (
					<p className='text-error'>
						{errorBrowserMessage} Veuillez consulter{' '}
						<a href='https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility'>
							<span className='underline'>cette page</span>
						</a>{' '}
						pour voir la compatibilité avec les navigateurs.
					</p>
				)}

				{error && <p className='text-error'>{error}</p>}

				{output && <p className='text-info'>{output}</p>}

				{progressPercentage !== 0 && (
					<div className='progress-bars-container'>
						<Progress percentage={progressPercentage} />
					</div>
				)}

				<div className='progress-text'>{progress}</div>
				{runtimeStats && (
					<p className='performances-text'>Performances : {runtimeStats}</p>
				)}

				{/* {isGenerating && <div>Chargement de la réponse...</div>}
				{currentProccess === 'translation' && (
					<p>Document en cours de traduction…</p>
				)}
				{currentProccess === 'correction' && (
					<p>Document en cours de corrrection…</p>
				)} */}
			</div>
			<div className='blocknote-container'>
				<BlockNoteView
					editor={mainEditor}
					className={
						showSecondEditor
							? 'blocknote-french'
							: 'blocknote-french full-width'
					}
					formattingToolbar={false}
				>
					<FormattingToolbarController
						formattingToolbar={() => (
							<CustomFormattingToolbar onSend={onSend} />
						)}
					/>
				</BlockNoteView>
				{showSecondEditor && (
					<BlockNoteView editor={secondEditor} className='blocknote-english' />
				)}
			</div>
		</>
	);
};
export default Demo;
