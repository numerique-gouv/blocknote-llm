import React from 'react';
import ReactDOM from 'react-dom/client';
import Demo from './Demo.tsx';
import './index.css';
import TestLlama3 from './TestLlama3.tsx';
import TestTransformer from './TestTransformer.tsx';
import WebLLM from './WebLLM.tsx';
import ChatComponent from './WebLLM2.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		{/* <Demo /> */}
		{/* <TestLlama3 /> */}
		{/* <TestTransformer /> */}
		<ChatComponent />
	</React.StrictMode>
);
