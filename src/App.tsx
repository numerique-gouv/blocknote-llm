//import './App.css';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView, useCreateBlockNote } from '@blocknote/react';
import '@blocknote/react/style.css';
import { useEffect, useState, useRef } from 'react';
import { Block } from '@blocknote/core';
import Progress from './components/Progress';

function App() {
	const [ready, setReady] = useState<null | boolean>(null);
	const [disabled, setDisabled] = useState(false);
	const [progressItems, setProgressItems] = useState([]);
	const [blocks, setBlocks] = useState<Block[]>([]);

	const [input, setInput] = useState<{ id: string; text: string }[]>([]);
	const [output, setOutput] = useState('');

	const editor = useCreateBlockNote();

	const worker = useRef(null);

	useEffect(() => {
		if (!worker.current) {
			worker.current = new Worker(new URL('./worker.js', import.meta.url), {
				type: 'module',
			});
		}

		const onMessageReceived = (e) => {
			switch (e.data.status) {
				case 'initiate':
					setReady(false);
					setProgressItems((prev) => [...prev, e.data]);
					break;

				case 'progress':
					setProgressItems((prev) =>
						prev.map((item) => {
							if (item.file === e.data.file) {
								return { ...item, progress: e.data.progress };
							}
							return item;
						})
					);
					break;

				case 'done':
					setProgressItems((prev) =>
						prev.filter((item) => item.file !== e.data.file)
					);
					break;

				case 'ready':
					setReady(true);
					break;

				case 'update':
					setOutput(e.data.output);
					break;

				case 'complete':
					setDisabled(false);
					setInput((prev) =>
						prev.map((item) => {
							if (item.id === e.data.id) {
								return { ...item, text: e.data.output[0].translation_text };
							}
							return item;
						})
					);
					test(input);
					break;
			}
		};

		worker.current.addEventListener('message', onMessageReceived);

		return () =>
			worker.current.removeEventListener('message', onMessageReceived);
	});

	const translate = () => {
		setDisabled(true);
		console.log(blocks);
		const string_input = transformateurJsonToString(blocks);
		for (const item of string_input) {
			console.log('Sending message to worker');
			worker.current.postMessage({
				text: item.text,
				id: item.id,
			});
			console.log('Message sent to worker');
		}
	};

	const translate2 = () => {
		//setDisabled(true);
		const string_input = editor.getSelectedText();
		console.log(string_input);
		console.log(editor.getTextCursorPosition());
	};

	const transformateurJsonToString = (block) => {
		const string = [];
		let id = '';
		for (let i = 0; i < block.length; i++) {
			let paragraph = '';
			id = block[i].id;
			if (block[i].type === 'table') {
				for (let j = 0; j < block[i].content.rows.length; j++) {
					//console.log(block[i].content.rows[j].cells);
					for (let k = 0; k < block[i].content.rows[j].cells.length; k++) {
						for (let l = 0; l < block[i].content.rows[j].cells[k].length; l++) {
							paragraph += ' ';
							paragraph += block[i].content.rows[j].cells[k][l]?.text;
						}
					}
				}
			} else {
				for (let j = 0; j < block[i].content.length; j++) {
					paragraph += block[i].content[j]?.text;
				}
			}
			if (paragraph !== '' && paragraph !== ' ') {
				string.push({ id: id, text: paragraph });
			}
		}
		console.log(string);
		setInput(string);
		return string;
	};

	const test = (output) => {
		for (const block of blocks) {
			for (const item of output) {
				if (block.id === item.id) {
					if (block.type === 'paragraph') {
						block.content.push({
							type: 'text',
							text: item.translation_text,
							styles: { textColor: 'red' },
						});
					}
				}
			}
		}
		console.log(blocks);
	};

	return (
		<div>
			<div>
				<BlockNoteView
					editor={editor}
					theme={'dark'}
					sideMenu={true}
					onChange={() => {
						// Saves the document JSON to state.
						setBlocks(editor.document);
					}}
				/>
			</div>
			<button disabled={disabled} onClick={translate2}>
				Translate
			</button>
			<button onClick={() => console.log(editor.getSelectedText())}>
				Clear
			</button>
			<div>{JSON.stringify(blocks)}</div>
			<div>{output}</div>
			<div className='progress-bars-container'>
				{ready === false && <label>Loading models... (only run once)</label>}
				{progressItems.map((data) => (
					<div key={data.file}>
						<Progress text={data.file} percentage={data.progress} />
					</div>
				))}
			</div>
		</div>
	);
}

export default App;
