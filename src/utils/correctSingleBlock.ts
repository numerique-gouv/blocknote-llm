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
		'Ce texte contient des fautes, corrige-les sans jamais changer les mots qu’il contient ni la ponctuation : ' +
			text,
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
