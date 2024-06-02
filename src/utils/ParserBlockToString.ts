import { Block } from '@blocknote/core';

export const transformateurJsonToString = (block: Block) => {
	let text = '';
	if (block.type === 'table') {
		for (const row of block.content.rows) {
			for (const cell of row.cells) {
				for (const item of cell) {
					text += ' ';
					if ('text' in item) {
						text += item.text;
					}
				}
			}
		}
	} else if (block.content) {
		for (const item of block.content) {
			if (item.type === 'link') {
                text += transformateurJsonToString({ type: 'paragraph', content: item.content })
            } else {
                text += item.text
            }
		}
	}

	return text;
};
