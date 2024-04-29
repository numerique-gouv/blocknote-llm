import React from 'react';
import ReactDOM from 'react-dom/client';
import Demo from './Demo.tsx';
import './index.css';
import TestLlama3 from './TestLlama3.tsx';
import TestTransformer from './TestTransformer.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<Demo />
		{/* <TestLlama3 /> */}
		{/* <TestTransformer /> */}
	</React.StrictMode>
);
