import { Block, BlockNoteEditor } from "@blocknote/core";
import {
    ToolbarButton,
    useBlockNoteEditor,
    useEditorContentOrSelectionChange,
} from "@blocknote/react";
import { useState } from "react";


// Custom Formatting Toolbar Button to translate text to English
export function TranslateToolbarButton({ onSend, engine }) {
    const editor = useBlockNoteEditor();

    async function translateSingleBlock (block: Block, editor: BlockNoteEditor) {
        const markdownBlock = await editor.blocksToMarkdownLossy([block])

        const translateProps = block.props
        translateProps["textColor"] = "blue"
        
        const newBlocks = editor.insertBlocks(
            [{
                "props": translateProps,
                "type": block.type
            }], 
            block.id, 
            "after"
        )
        await onSend(
            "Translate this text to English, preserving the markdown style : " + markdownBlock,
            'translation',
            async (markdownText: string) => {
                try {
                    const convertedBlocks =  await editor.tryParseMarkdownToBlocks(markdownText)
                    editor.updateBlock(newBlocks[0].id, {content: convertedBlocks[0].content, props: ""})
                } catch (error) {
                    console.log(error)
                }
                // const convertedBlock = editor.tryParseMarkdownToBlocks(markdownText)[0]
                
                // console.log(newBlocks[0].id)
            }
        )
    }

    async function translateBlocks(blocks: Block[], editor: BlockNoteEditor) {
        if (blocks.length == 1) {
            const block = blocks[0]
            const text = editor.getSelectedText()
            const translateProps = block.props
            translateProps["textColor"] = "blue"
            const newBlock = editor.insertBlocks(
                [{
                    "props": translateProps,
                    "type": block.type
                }],
                block.id,
                'after'
            )[0]
            onSend(
                "Translate this text to English : " + text,
                'translation',
                async (translatedText: string) => {
                    editor.updateBlock(newBlock.id, {"content": translatedText})
                }
            )
        } else {
            for (const block of blocks) {
                await translateSingleBlock(block, editor)
            }
        }
    }

    const [selectedBlocks, setSelectedBlocks] = useState<Block[]>([])

    // Updates state on content or selection change.
    useEditorContentOrSelectionChange(() => {
        const selection = editor.getSelection()
        if (selection !== undefined) {
            setSelectedBlocks(selection.blocks);
          } else {
            setSelectedBlocks([editor.getTextCursorPosition().block]);
          }
    }, editor);

    return (
        <ToolbarButton
        mainTooltip={"Traduire"}
        onClick={() => {
            translateBlocks(editor.getSelection()?.blocks, editor)
        }}>
        Traduire
        </ToolbarButton>
    );
}