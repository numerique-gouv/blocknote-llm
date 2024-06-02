import { Block, BlockNoteEditor } from '@blocknote/core';
import {
	ToolbarButton,
	useBlockNoteEditor,
	useEditorContentOrSelectionChange,
} from '@blocknote/react';
import { useState } from 'react';
import correctSingleBlock from '../utils/correctSingleBlock';
import { EngineInterface } from '@mlc-ai/web-llm';

// Custom Formatting Toolbar Button to correct the selected text
export function CorrectToolbarButton({ onSend, isGenerating, setIsGenerating, currentProccess, setCurrentProcess, isFetching, setOutput }) {
	const editor = useBlockNoteEditor();

    async function correctBlocks(blocks: Block[], editor: BlockNoteEditor) {
        setIsGenerating(true)
        setCurrentProcess('correction')
        const correctedTextColor = 'blue'
        if (false && blocks.length == 1) {
            const text = editor.getSelectedText()
            const block = blocks[0]
            const correctProps = block.props
            correctProps['textColor'] = correctedTextColor
            const newBlocks = editor.insertBlocks(
                [{
                    props: correctProps,
                    type: block.type
                }], 
                block.id, 
                'after'
            )
            const newBlock = newBlocks[0]
            await correctSingleBlock(
//                {"content": [{"type":"text", "text": text}]},
                block,
                newBlock,
                editor,
                editor,
                onSend,
                )
        } else {
            console.log("correctBlocks")
            for (const block of blocks) {
                const correctProps = block.props
                correctProps['textColor'] = correctedTextColor
                if (block.content !== []) {
                    const newBlocks = editor.insertBlocks(
                        [{
                            props: correctProps,
                            type: block.type
                        }], 
                        block.id, 
                        'after'
                    )
                    const newBlock = newBlocks[0]
                    await correctSingleBlock(block, newBlock, editor, editor, onSend)
                }
            }
        }
        setIsGenerating(false)
        setCurrentProcess(null)
        setOutput('')
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
			mainTooltip={'Corriger'}
            isDisabled={isFetching||isGenerating}
			onClick={() => {
				correctBlocks(editor.getSelection()?.blocks, editor);
			}}
		>
			Corriger
		</ToolbarButton>
	);
}
