import { useState } from 'react';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView, useCreateBlockNote } from '@blocknote/react';
import '@blocknote/react/style.css';
import './App.css';
import { Engine } from '@mlc-ai/web-llm';
import ChatUI from './ChatUI';
import { transformateurJsonToString } from './utils/ParserBlockToString';
import { BlockNoteEditor } from '@blocknote/core';

const Demo = () => {
	const [disabled, setDisabled] = useState<boolean>(false);
	const [translation, setTranslation] = useState<boolean>(false);
	//const [translationCount, setTranslationCount] = useState<number>(0);

	const [messages, setMessages] = useState<{ kind: string; text: string }[]>(
		[]
	);
	const [runtimeStats, setRuntimeStats] = useState('');
	const [chat_ui] = useState(new ChatUI(new Engine()));

	const editorFrench = useCreateBlockNote();
	const editorEnglish = useCreateBlockNote({
		initialContent: editorFrench.document,
	});

	const updateMessage = (kind: string, text: string, append: boolean) => {
		if (kind == 'init') {
			text = '[System Initalize] ' + text;
		}
		const msgCopy = [...messages];
		if (msgCopy.length == 0 || append) {
			setMessages([...msgCopy, { kind, text }]);
		} else {
			msgCopy[msgCopy.length - 1] = { kind, text };
			setMessages([...msgCopy]);
		}
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
				chat_ui
					.onGenerateTranslation(
						prompt,
						updateMessage,
						updateBlock,
						editorEnglish,
						id,
						setRuntimeStats,
						setDisabled
					)
					.catch((error) => console.log(error));

				// editorEnglish.updateBlock(id, {
				// 	content: [
				// 		{
				// 			type: 'text',
				// 			text: '',
				// 			styles: { textColor: 'red' },
				// 		},
				// 	],
				// });
			}
		}
	};

	const duplicateEditor = async (
		initialEditor: BlockNoteEditor,
		duplicateEditor: BlockNoteEditor
	) => {
		const idBlock: string[] = [];
		await initialEditor.tryParseMarkdownToBlocks(''); //Fix bug
		duplicateEditor.replaceBlocks(
			duplicateEditor.document,
			initialEditor.document
		);
		initialEditor.forEachBlock((block) => {
			const text = transformateurJsonToString(block);
			if (text !== '') {
				idBlock.push(block.id);
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
		return idBlock;
	};

	const updateBlock = (
		editor: BlockNoteEditor,
		blockId: string,
		text: string
	) => {
		const block = editor.getBlock(blockId);
		if (block) {
			editor.updateBlock(blockId, {
				content: [
					{
						type: 'text',
						text: text,
						styles: { textColor: 'red' },
					},
				],
			});
		}
	};

	return (
		<>
			<div className='translate-button'>
				{disabled && <p>Document en cours de traduction ...</p>}
				{runtimeStats && <p>Vitesse : {runtimeStats}</p>}
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
