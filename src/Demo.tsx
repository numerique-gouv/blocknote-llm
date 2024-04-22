import { useRef, useState, useEffect } from 'react';
import '@blocknote/core/fonts/inter.css';
import {
	BlockNoteView,
	DragHandleButton,
	SideMenu,
	SideMenuController,
	useCreateBlockNote,
} from '@blocknote/react';
import '@blocknote/react/style.css';

import TranslateBlockButton from './TranslateBlockButton';
import { Block } from '@blocknote/core';
import Progress from './components/Progress';
import './Test.css';

const Demo = () => {
	const [ready, setReady] = useState<null | boolean>(null);
	const [disabled, setDisabled] = useState(false);
	const [progressItems, setProgressItems] = useState([]);
	const [blocks, setBlocks] = useState<Block[]>([]);

	const [input, setInput] = useState<{ id: string; text: string }[]>([]);
	const [output, setOutput] = useState('');

	const editor = useCreateBlockNote();

	const worker = useRef<Worker | null>(null);

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
					editor.insertBlocks(
						[
							{
								type: 'paragraph',
								content: [
									{
										type: 'text',
										text: e.data.output[0].translation_text,
										styles: { textColor: 'red' },
									},
								],
							},
						],
						e.data.id,
						'after'
					);
					break;
			}
		};

		worker.current.addEventListener('message', onMessageReceived);

		return () =>
			worker.current?.removeEventListener('message', onMessageReceived);
	});

	return (
		<>
			<BlockNoteView
				editor={editor}
				sideMenu={false}
				onChange={() => {
					// Saves the document JSON to state.
					setBlocks(editor.document);
				}}
			>
				<SideMenuController
					sideMenu={(props) => (
						<SideMenu {...props}>
							<TranslateBlockButton worker={worker} {...props} />
							<DragHandleButton {...props} />
						</SideMenu>
					)}
				/>
			</BlockNoteView>
			<div className='progress-bars-container'>
				{ready === false && <label>Loading models... (only run once)</label>}
				{progressItems.map((data) => (
					<div key={data.file}>
						<Progress text={data.file} percentage={data.progress} />
					</div>
				))}
			</div>
		</>
	);
};
export default Demo;
