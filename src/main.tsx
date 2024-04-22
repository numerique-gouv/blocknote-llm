import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
//import './index.css';
import Transformers from './Transformers.tsx';
import Demo from './Demo.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		{/* <App /> */}
		{/*<Transformers />*/}
		<Demo />
	</React.StrictMode>
);
