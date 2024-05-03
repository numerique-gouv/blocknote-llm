import { Block } from '@blocknote/core';

export const transformateurJsonToString = (block: Block) => {
	let text = '';
	if (block.type === 'table') {
		for (let i = 0; i < block.content.rows.length; i++) {
			for (let j = 0; j < block.content.rows[i].cells.length; j++) {
				for (let k = 0; k < block.content.rows[i].cells[j].length; k++) {
					text += ' ';
					text += block.content.rows[i].cells[j][k]?.text;
				}
			}
		}
	} else if (block.content) {
		for (let i = 0; i < block.content.length; i++) {
			text += block.content[i]?.text;
		}
	}

	return text;
};
