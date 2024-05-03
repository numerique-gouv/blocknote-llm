import { Block } from "@blocknote/core";
import {
    ToolbarButton,
    useBlockNoteEditor,
    useEditorContentOrSelectionChange,
} from "@blocknote/react";
import { useState } from "react";


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
        mainTooltip={"Translate"}
        onClick={() => {
            translateBlocks(editor.getSelection()?.blocks)
        }}>
        Translate
        </ToolbarButton>
    );
}