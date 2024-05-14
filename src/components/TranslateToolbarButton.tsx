import { Block, BlockNoteEditor } from "@blocknote/core";
import {
    ToolbarButton,
    useBlockNoteEditor,
    useEditorContentOrSelectionChange,
} from "@blocknote/react";
import { useState } from "react";

function translateString(text: string) {

}

async function translateSingleBlock (block: Block, editor: BlockNoteEditor) {
    const markdownBlock = await editor.blocksToMarkdownLossy([block])
    const translatedMarkdownBlockPromise = translateString(markdownBlock)
    editor.insertBlocks(
        [{
            "props": block.props,
            "type": block.type,
            "id": block.id + "0"
        }], 
        block.id, 
        "after"
        )
    
    var response = ""
    for chunk in translatedMarkdownBlockPromise:
        response += chunk
        editor.updateBlock()
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