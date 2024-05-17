import { Block, BlockNoteEditor } from "@blocknote/core";
import {
    ToolbarButton,
    useBlockNoteEditor,
    useEditorContentOrSelectionChange,
} from "@blocknote/react";
import { useState } from "react";
import diffText from "../utils/diffText";
import correctSingleBlock from "../utils/correctSingleBlock";

// Custom Formatting Toolbar Button to correct the selected text
export function CorrectToolbarButton({ onSend }) {
    const editor = useBlockNoteEditor();

    async function correctBlocks(blocks: Block[], editor: BlockNoteEditor) {
        for (const block of blocks) {
            const correctProps = block.props
            correctProps["textColor"] = "blue"
            const newBlocks = editor.insertBlocks(
                [{
                    "props": correctProps,
                    "type": block.type
                }], 
                block.id, 
                "after"
            )
            const newBlock = newBlocks[0]
            await correctSingleBlock(block, newBlock, editor, editor, onSend)
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
        mainTooltip={"Corriger"}
        onClick={() => {
            correctBlocks(editor.getSelection()?.blocks, editor)
        }}>
        Corriger
        </ToolbarButton>
    );
}