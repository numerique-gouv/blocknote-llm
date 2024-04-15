import './App.css';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView, useCreateBlockNote } from '@blocknote/react';
import '@blocknote/react/style.css';

function App() {
	const editor = useCreateBlockNote();

	return <BlockNoteView editor={editor} sideMenu={true} />;
}

export default App;
