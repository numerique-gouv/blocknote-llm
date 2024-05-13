import { Block, BlockNoteEditor } from "@blocknote/core";
import {
    ToolbarButton,
    useBlockNoteEditor,
    useEditorContentOrSelectionChange,
} from "@blocknote/react";
import { useState } from "react";

function translateSingleBlock(block: Block, editor: BlockNoteEditor) {
    const markdownBlock = editor.blocksToMarkdownLossy([block])
    const translatedMarkdownBlock = translate(markdownBlock)
    editor.insertBlocks(editor.tryParseMarkdownToBlocks(translatedMarkdownBlock), block.id, "after")
}

function translateBlocks(blocks: Block[], editor: BlockNoteEditor) {
    for (const block of blocks) {
        
    }
}

// Custom Formatting Toolbar Button to translate text to English
export function TranslateToolbarButton() {
    const editor = useBlockNoteEditor();

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
            translateBlocks(editor.getSelection()?.blocks)
        }}>
        Traduire
        </ToolbarButton>
    );
}