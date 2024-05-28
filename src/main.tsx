import React from 'react';
import ReactDOM from 'react-dom/client';
import Demo from './Demo.tsx';
import './index.css';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<MantineProvider>
			<Demo />
		</MantineProvider>
	</React.StrictMode>
);
