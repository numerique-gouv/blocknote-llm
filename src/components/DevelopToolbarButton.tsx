import { Block, BlockNoteEditor } from '@blocknote/core';
import {
	ToolbarButton,
	useBlockNoteEditor,
	useEditorContentOrSelectionChange,
} from '@blocknote/react';
import { useState } from 'react';
import { addBlock, getEditorBlocks, updateBlock } from '../utils/blockManipulation';
import { transformateurJsonToString } from '../utils/ParserBlockToString';

export function DevelopToolbarButton({ onSend }) {

    const editor = useBlockNoteEditor();

    async function developBlocks(blocks: Block[]) {

        const newBlocks = editor.insertBlocks(
            [{
                type: "paragraph",
                content: []
            }],
            blocks[blocks.length-1].id,
            "after"
        )
        let text = '';
        for (const block of blocks) {
            if (block) {
                text += transformateurJsonToString(block);
            }
        }
        if (text !== '') {
            const prompt = 'Développe un texte à partir de ces éléments : ' + text;
            await onSend(prompt, 'developpe', (text: string) => {
                updateBlock(editor, newBlocks[0].id, text, 'blue');
            });
        }
    }

    const [selectedBlocks, setSelectedBlocks] = useState<Block[]>([]);

	// Updates state on content or selection change.
	useEditorContentOrSelectionChange(() => {
		const selection = editor.getSelection();
		if (selection !== undefined) {
			setSelectedBlocks(selection.blocks);
		} else {
			setSelectedBlocks([editor.getTextCursorPosition().block]);
		}
	}, editor);

	return (
		<ToolbarButton
			mainTooltip={'Développer'}
			onClick={() => {
				developBlocks(editor.getSelection()?.blocks, editor);
			}}
		>
			Développer
		</ToolbarButton>
	);

}