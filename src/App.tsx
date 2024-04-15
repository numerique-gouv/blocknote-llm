import './App.css';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView, useCreateBlockNote } from '@blocknote/react';
import '@blocknote/react/style.css';
import { useState } from "react";
import { Block } from "@blocknote/core";


function App() {
    const [blocks, setBlocks] = useState<Block[]>([]);

	const editor = useCreateBlockNote();

	return (
    <div>
    <div>
        <BlockNoteView 
            editor={editor}
            sideMenu={true} 
            onChange={() => {
                // Saves the document JSON to state.
                setBlocks(editor.document);}}
        />;
    </div>
    <div>Document JSON:</div>
    <div className={"item bordered"}>
        <pre>
            <code>{JSON.stringify(blocks, null, 2)}</code>
        </pre>
    </div>
    </div>)
}

export default App;
