import * as webllm from '@mlc-ai/web-llm';
import { useEffect, useState } from 'react';

import { MODEL_DESCRIPTIONS, Model } from '../models';
import { appConfig } from '../app-config';
import useChatStore from '../hooks/useChatStore';

const ModelsDropdown = ({
	resetEngineAndChatHistory,
}: {
	resetEngineAndChatHistory: () => void;
}) => {
	const selectedModel = useChatStore((state) => state.selectedModel);
	const setSelectedModel = useChatStore((state) => state.setSelectedModel);

	const [modelsState, setModelsState] = useState<{ [key: string]: boolean }>(
		{}
	);

	const IS_MODEL_STATUS_CHECK_ENABLED = false;

	const updateModelStatus = async () => {
		console.log('Checking model status');
		Object.values(Model).forEach(async (model) => {
			const isInCache = await webllm.hasModelInCache(model, appConfig);
			console.log(`${model} in cache: ${isInCache}`);
			setModelsState((prev) => ({ ...prev, [model]: isInCache }));
		});
	};

	useEffect(() => {
		if (IS_MODEL_STATUS_CHECK_ENABLED) {
			updateModelStatus();
		}
	}, []);

	return (
		<div>
			<div>
				{Object.values(Model).map((model, index) => (
					<div key={index}>
						<div>{model}</div>
						<span>{modelsState[model] ? 'Cached' : 'Not Cached'}</span>
					</div>
				))}
			</div>
		</div>
	);
};

export default ModelsDropdown;
