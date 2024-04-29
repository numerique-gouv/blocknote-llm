import { useRef, useState, useEffect } from 'react';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView, useCreateBlockNote } from '@blocknote/react';
import '@blocknote/react/style.css';
import * as webllm from '@mlc-ai/web-llm';
import Progress from './components/Progress';
import './App.css';
import { Block } from '@blocknote/core';
import { appConfig } from './app-config';

interface WorkerMessage {
	status: string;
	text?: string;
	file: string;
	progress: number;
	id: string;
	output: [{ translation_text: string }];
}

const Demo = () => {
	const [ready, setReady] = useState<null | boolean>(null);
	const [disabled, setDisabled] = useState<boolean>(false);
	const [translation, setTranslation] = useState<boolean>(false);
	const [progressItems, setProgressItems] = useState<WorkerMessage[]>([]);
	const [translationCount, setTranslationCount] = useState<number>(0);
	const [loading, setLoading] = useState<string>('');

	const editorFrench = useCreateBlockNote();
	const editorEnglish = useCreateBlockNote({
		initialContent: editorFrench.document,
	});

	const worker = useRef<Worker | null>(null);

	useEffect(() => {
		if (!worker.current) {
			worker.current = new Worker(new URL('./worker.js', import.meta.url), {
				type: 'module',
			});
		}

		const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
			switch (e.data.status) {
				case 'initiate':
					setReady(false);
					setProgressItems((prev) => [...prev, e.data]);
					break;

				case 'progress':
					setProgressItems((prev) =>
						prev.map((item) => {
							if (item.file === e.data.file) {
								return { ...item, progress: e.data.progress };
							}
							return item;
						})
					);
					break;

				case 'done':
					setProgressItems((prev) =>
						prev.filter((item) => item.file !== e.data.file)
					);
					break;

				case 'ready':
					setReady(true);
					break;

				case 'update':
					break;

				case 'complete':
					console.log(e.data.output[0].translation_text);
					editorEnglish.updateBlock(e.data.id, {
						content: [
							{
								type: 'text',
								text: e.data.output[0].translation_text,
								styles: { textColor: 'red' },
							},
						],
					});

					break;
			}
		};

		worker.current.addEventListener('message', onMessageReceived);

		return () =>
			worker.current?.removeEventListener('message', onMessageReceived);
	});

	useEffect(() => {
		if (translationCount === 0) {
			setDisabled(false);
		}
	}, [translationCount]);

	const transformateurJsonToString = (block: Block) => {
		let text = '';
		if (block.type === 'table') {
			for (let i = 0; i < block.content.rows.length; i++) {
				for (let j = 0; j < block.content.rows[i].cells.length; j++) {
					for (let k = 0; k < block.content.rows[i].cells[j].length; k++) {
						text += ' ';
						text += block.content.rows[i].cells[j][k]?.text;
					}
				}
			}
		} else if (block.content) {
			for (let i = 0; i < block.content.length; i++) {
				text += block.content[i]?.text;
			}
		}

		return text;
	};

	const translate = async () => {
		console.log(editorFrench.document);
		//console.log(editorEnglish.document);

		const initProgressCallback = (report: webllm.InitProgressReport) => {
			setLoading(report.text);
		};
		const selectedModel = 'CroissantLLMChat-v0.1-q4f32_1';
		const engine: webllm.EngineInterface = await webllm.CreateWebWorkerEngine(
			new Worker(new URL('./workerLlama.ts', import.meta.url), {
				type: 'module',
			}),
			selectedModel,
			{ appConfig: appConfig, initProgressCallback: initProgressCallback }
		);?
		const idBlock: string[] = [];
		await editorFrench.tryParseMarkdownToBlocks(''); //Fix bug
		editorEnglish.replaceBlocks(editorEnglish.document, editorFrench.document);
		editorFrench.forEachBlock((block) => {
			const text = transformateurJsonToString(block);
			if (text !== '') {
				setTranslationCount((prevCount) => prevCount + 1);
				idBlock.push(block.id);
				editorEnglish.updateBlock(block.id, {
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
		for (const id of idBlock) {
			const block = editorFrench.getBlock(id);
			let text = '';
			if (block) {
				text = transformateurJsonToString(block);
			}
			if (text !== '') {
				const prompt = 'Tu peux me traduire ce texte en anglais : ';
				const reply0 = await engine.chat.completions.create({
					stream: true,
					messages: [{ role: 'user', content: prompt + text }],
				});

				editorEnglish.updateBlock(id, {
					content: [
						{
							type: 'text',
							text: '',
							styles: { textColor: 'red' },
						},
					],
				});

				for await (const chunk of reply0) {
					const curlDelta = chunk.choices[0].delta.content;
					if (curlDelta) {
						const existingBlock = editorEnglish.getBlock(id);
						if (existingBlock) {
							const updatedText = existingBlock.content?.[0]?.text || '';
							editorEnglish.updateBlock(id, {
								content: [
									{
										type: 'text',
										text: updatedText + curlDelta,
										styles: { textColor: 'red' },
									},
								],
							});
						}
					}
				}
				console.log(await engine.runtimeStatsText());
				console.log(await engine.getMessage());
				setTranslationCount((prevCount) => prevCount - 1);
			}
		}
	};

	return (
		<>
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
			<div className='translate-button'>
				{disabled && <p>Document en cours de traduction ...</p>}
				<div style={{ marginBottom: '15px' }}>{loading}</div>
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
			</div>

			<div className='progress-bars-container'>
				{ready === false && <label>Loading models... (only run once)</label>}
				{progressItems.map((data) => (
					<div key={data.file}>
						<Progress text={data.file} percentage={data.progress} />
					</div>
				))}
			</div>
		</>
	);
};
export default Demo;
