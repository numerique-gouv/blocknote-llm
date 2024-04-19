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

	const [input, setInput] = useState('I love walking my dog.');
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
					break;
			}
		};

		worker.current.addEventListener('message', onMessageReceived);

		return () =>
			worker.current.removeEventListener('message', onMessageReceived);
	});

	const translate = () => {
		setDisabled(true);
		const input = transformateurJsonToString(blocks);
		console.log(input);
		worker.current.postMessage({
			text: input[0],
		});
	};

	const transformateurJsonToString = (block) => {
		const string = [];
		for (let i = 0; i < block.length; i++) {
			let paragraph = '';
			if (block[i].type === 'table') {
				for (let j = 0; j < block[i].content.rows.length; j++) {
					for (let k = 0; k < block[i].content.rows[j].cells.length; k++) {
						string.push(block[i].content.rows[j].cells[k]);
						let table = '';
						table += block[i].content.rows[j].cells[k].text;
						string.push(table);
					}
				}
			} else {
				for (let j = 0; j < block[i].content.length; j++) {
					paragraph += block[i].content[j].text;
				}
			}
			string.push(paragraph);
		}
		//console.log(string);
		return string;
	};

	return (
		<div>
			<div>
				<BlockNoteView
					editor={editor}
					sideMenu={true}
					onChange={() => {
						// Saves the document JSON to state.
						setBlocks(editor.document);
					}}
				/>
			</div>
			<button disabled={disabled} onClick={translate}>
				Translate
			</button>
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
