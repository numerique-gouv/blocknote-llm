import * as webllm from '@mlc-ai/web-llm';
import { create } from 'zustand';

interface State {
	// Engine
	engine: webllm.EngineInterface | null;
	setEngine: (engine: webllm.EngineInterface) => void;

	// Progress
	progress: string;
	setProgress: (progress: string) => void;

	// Progress percentage
	progressPercentage: number;
	setProgressPercentage: (progressPercentage: number) => void;

	// User input
	userInput: string;
	setUserInput: (input: string) => void;

	// Loading state
	isFetching: boolean;
	setIsFetching: (isFetching: boolean) => void;

	// Inference state
	isGenerating: boolean;
	setIsGenerating: (isGenerating: boolean) => void;

	// Output
	output: string;
	setOutput: (input: string) => void;
}

const useChatStore = create<State>((set) => ({
	engine: null,
	setEngine: (engine: webllm.EngineInterface) => set({ engine }),

	progress: 'Not loadeed',
	setProgress: (progress: string) => set({ progress }),

	progressPercentage: 0,
	setProgressPercentage: (progressPercentage: number) =>
		set({ progressPercentage }),

	userInput: '',
	setUserInput: (input: string) => set({ userInput: input }),

	isFetching: false,
	setIsFetching: (isFetching: boolean) => set({ isFetching }),

	isGenerating: false,
	setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),

	output: '',
	setOutput: (output: string) => set({ output }),
}));

export default useChatStore;
