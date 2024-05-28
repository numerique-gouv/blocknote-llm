import { BlockNoteEditor, StyleSchema, StyledText } from '@blocknote/core';
import { transformateurJsonToString } from './ParserBlockToString';

export const updateContentBlock = (
	editor: BlockNoteEditor,
	blockId: string,
	content: StyledText<StyleSchema>[]
) => {
	const block = editor.getBlock(blockId);
	if (block) {
		editor.updateBlock(blockId, {
			content: content,
		});
	}
};

export const updateBlock = (
	editor: BlockNoteEditor,
	blockId: string,
	text: string,
	textColor: string = 'black'
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

export const addBlock = (
	editor: BlockNoteEditor,
	blockId: string,
	text: string,
	textColor: string = 'black',
	textPosition: 'before' | 'after' | 'nested' = 'after',
	idBlockToInsert?: string
) => {
	const block = editor.getBlock(blockId);
	if (block) {
		editor.insertBlocks(
			[
				{
					id: idBlockToInsert,
					content: [
						{
							type: 'text',
							text: text,
							styles: { textColor: textColor },
						},
					],
				},
			],
			blockId,
			textPosition
		);
	}
};

export const getEditorBlocks = (editor: BlockNoteEditor) => {
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

export const duplicateEditor = async (
	initialEditor: BlockNoteEditor,
	duplicateEditor: BlockNoteEditor,
	placeholder: string,
	textColor: string = 'black'
) => {
	const idBlocks: string[] = [];
	let isFirstBlock = true;

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
						text: isFirstBlock ? placeholder : '',
						styles: { textColor: textColor },
					},
				],
			});
			isFirstBlock = false;
		}
		return true;
	});
	return idBlocks;
};
