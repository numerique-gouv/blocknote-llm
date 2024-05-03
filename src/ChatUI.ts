import { EngineInterface } from '@mlc-ai/web-llm';
import { appConfig } from './app-config';
import { BlockNoteEditor } from '@blocknote/core';

export default class ChatUI {
	private engine: EngineInterface;
	private chatLoaded = false;
	private requestInProgress = false;
	// We use a request chain to ensure that
	// all requests send to chat are sequentialized
	private chatRequestChain: Promise<void> = Promise.resolve();

	constructor(engine: EngineInterface) {
		this.engine = engine;
	}
	/**
	 * Push a task to the execution queue.
	 *
	 * @param task The task to be executed;
	 */
	private pushTask(task: () => Promise<void>) {
		const lastEvent = this.chatRequestChain;
		this.chatRequestChain = lastEvent.then(task);
	}
	// Event handlers
	// all event handler pushes the tasks to a queue
	// that get executed sequentially
	// the tasks previous tasks, which causes them to early stop
	// can be interrupted by chat.interruptGenerate
	async onGenerate(
		prompt: string,
		messageUpdate: (kind: string, text: string, append: boolean) => void,
		setRuntimeStats: (runtimeStats: string) => void
	) {
		if (this.requestInProgress) {
			return;
		}
		this.pushTask(async () => {
			await this.asyncGenerate(prompt, messageUpdate, setRuntimeStats);
		});
		return this.chatRequestChain;
	}

	async onGenerateTranslation(
		prompt: string,
		messageUpdate: (kind: string, text: string, append: boolean) => void,
		blockUpdate: (
			editor: BlockNoteEditor,
			blockId: string,
			text: string
		) => void,
		editor: BlockNoteEditor,
		blockId: string,
		setRuntimeStats: (runtimeStats: string) => void,
		setDisabled: (disabled: boolean) => void
	) {
		if (this.requestInProgress) {
			return;
		}
		this.pushTask(async () => {
			await this.asyncGenerateTranslation(
				prompt,
				messageUpdate,
				blockUpdate,
				editor,
				blockId,
				setRuntimeStats,
				setDisabled
			);
		});
		return this.chatRequestChain;
	}

	async onReset(clearMessages: () => void) {
		if (this.requestInProgress) {
			// interrupt previous generation if any
			this.engine.interruptGenerate();
		}
		// try reset after previous requests finishes
		this.pushTask(async () => {
			await this.engine.resetChat();
			clearMessages();
		});
		return this.chatRequestChain;
	}

	async asyncInitChat(
		messageUpdate: (kind: string, text: string, append: boolean) => void
	) {
		if (this.chatLoaded) return;
		this.requestInProgress = true;
		messageUpdate('init', '', true);
		const initProgressCallback = (report: { text: string }) => {
			messageUpdate('init', report.text, false);
		};
		this.engine.setInitProgressCallback(initProgressCallback);

		try {
			const selectedModel = 'CroissantLLMChat-v0.1-q4f16_1';
			// const selectedModel = "TinyLlama-1.1B-Chat-v0.4-q4f16_1-1k";
			await this.engine.reload(selectedModel, undefined, appConfig);
		} catch (err: unknown) {
			messageUpdate('error', 'Init error, ' + (err?.toString() ?? ''), true);
			console.log(err);
			await this.unloadChat();
			this.requestInProgress = false;
			return;
		}
		this.requestInProgress = false;
		this.chatLoaded = true;
	}

	private async unloadChat() {
		await this.engine.unload();
		this.chatLoaded = false;
	}

	/**
	 * Run generate
	 */
	private async asyncGenerate(
		prompt: string,
		messageUpdate: (kind: string, text: string, append: boolean) => void,
		setRuntimeStats: (runtimeStats: string) => void
	) {
		await this.asyncInitChat(messageUpdate);
		this.requestInProgress = true;
		// const prompt = this.uiChatInput.value;
		if (prompt == '') {
			this.requestInProgress = false;
			return;
		}

		messageUpdate('right', prompt, true);
		// this.uiChatInput.value = "";
		// this.uiChatInput.setAttribute("placeholder", "Generating...");

		messageUpdate('left', '', true);

		try {
			let curMessage = '';
			const completion = await this.engine.chat.completions.create({
				stream: true,
				messages: [{ role: 'user', content: prompt }],
			});
			for await (const chunk of completion) {
				const curDelta = chunk.choices[0].delta.content;
				if (curDelta) {
					curMessage += curDelta;
				}
				messageUpdate('left', curMessage, false);
			}
			const output = await this.engine.getMessage();
			messageUpdate('left', output, false);
			this.engine
				.runtimeStatsText()
				.then((stats) => setRuntimeStats(stats))
				.catch((error) => console.log(error));
		} catch (err: unknown) {
			messageUpdate(
				'error',
				'Generate error, ' + (err?.toString() ?? ''),
				true
			);
			console.log(err);
			await this.unloadChat();
		}
		this.requestInProgress = false;
	}

	private async asyncGenerateTranslation(
		prompt: string,
		messageUpdate: (kind: string, text: string, append: boolean) => void,
		blockUpdate: (
			editor: BlockNoteEditor,
			blockId: string,
			text: string
		) => void,
		editor: BlockNoteEditor,
		id: string,
		setRuntimeStats: (runtimeStats: string) => void,
		setDisabled: (disabled: boolean) => void
	) {
		await this.asyncInitChat(messageUpdate);
		this.requestInProgress = true;
		// const prompt = this.uiChatInput.value;
		if (prompt == '') {
			this.requestInProgress = false;
			return;
		}

		messageUpdate('right', prompt, true);
		// this.uiChatInput.value = "";
		// this.uiChatInput.setAttribute("placeholder", "Generating...");

		messageUpdate('left', '', true);

		try {
			let curMessage = '';
			const completion = await this.engine.chat.completions.create({
				stream: true,
				messages: [{ role: 'user', content: prompt }],
			});
			for await (const chunk of completion) {
				const curDelta = chunk.choices[0].delta.content;
				if (curDelta) {
					curMessage += curDelta;
				}
				messageUpdate('left', curMessage, false);
				blockUpdate(editor, id, curMessage);
			}
			const output = await this.engine.getMessage();
			messageUpdate('left', output, false);
			setDisabled(false);
			this.engine
				.runtimeStatsText()
				.then((stats) => setRuntimeStats(stats))
				.catch((error) => console.log(error));
		} catch (err: unknown) {
			messageUpdate(
				'error',
				'Generate error, ' + (err?.toString() ?? ''),
				true
			);
			console.log(err);
			await this.unloadChat();
		}
		this.requestInProgress = false;
	}
}
