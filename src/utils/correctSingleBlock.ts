import { Block, BlockNoteEditor } from '@blocknote/core';
import diffText from './diffText';
import { EngineInterface } from '@mlc-ai/web-llm';

async function correctSingleBlock(
	sourceBlock: Block | undefined,
	destBlock: Block | undefined,
	sourceEditor: BlockNoteEditor,
	destEditor: BlockNoteEditor,
	onSend: Function,
	loadedEngine: EngineInterface
) {
	let text = '';
	// get plain text of sourceBlock
	for (const sequence of sourceBlock.content) {
		text += sequence['text'];
	}

	await onSend(
		loadedEngine,
		"Je veux que tu recopies mot pour mot ce texte en corrigeant les fautes d'orthographes en francais sans introduction, ni explication, ni contexte, il suffit d'écrire la correction." +
			text,
		'correction',
		async (correctedText: string) => {
			try {
				const [sourceContent, correctedContent] = diffText(text, correctedText);

				destEditor.updateBlock(destBlock.id, { content: correctedContent });
				sourceEditor.updateBlock(sourceBlock.id, { content: sourceContent });
			} catch (error) {
				console.log(error);
			}
		}
	);
}

export default correctSingleBlock;
