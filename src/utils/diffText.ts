import { StyleSchema, StyledText } from '@blocknote/core';
import { diffWords } from 'diff'

function diffText(
	originalText: string,
	correctedText: string,
    design: number = 2
): [StyledText<StyleSchema>[], StyledText<StyleSchema>[]] {
	const originalWords = originalText.split(/[   ]/);
	const correctedWords = correctedText.split(/[   ]/);
	const formattedSourceContent: StyledText<StyleSchema>[] = [];
	const formattedCorrectedContent: StyledText<StyleSchema>[] = [];

    if (design == 1) {
        for (
            let index = 0;
            index < correctedWords.length && index < originalWords.length;
            index++
        ) {
            const correctedWord = correctedWords[index];
            const originalWord = originalWords[index];
            if (correctedWord === originalWord) {
                formattedSourceContent.push({
                    type: 'text',
                    text: originalWord + ' ',
                    styles: {},
                });
                formattedCorrectedContent.push({
                    type: 'text',
                    text: originalWord + ' ',
                    styles: {},
                });
            } else {
                formattedSourceContent.push({
                    type: 'text',
                    text: originalWord + ' ',
                    styles: { backgroundColor: 'red' },
                });
                formattedCorrectedContent.push({
                    type: 'text',
                    text: correctedWord + ' ',
                    styles: { backgroundColor: 'red' },
                });
            }
        }

        for (
            let index = correctedWords.length;
            index < originalWords.length;
            index++
        ) {
            const word = originalWords[index];
            formattedSourceContent.push({
                type: 'text',
                text: word + ' ',
                styles: {},
            });
        }

	    return [formattedSourceContent, formattedCorrectedContent];
    } else {
        const diff = diffWords(originalText, correctedText)
        let sourceContent = []
        let correctedContent = []
        for (const sequence of diff) {
            if (sequence.added) {
                correctedContent.push({
                    type: 'text',
                    text: sequence.value,
                    styles: { backgroundColor: 'green'}
                })
            } else if (sequence.removed) {
                sourceContent.push({
                    type: 'text',
                    text: sequence.value,
                    styles: { backgroundColor: 'red'}
                })
            } else {
                correctedContent.push({
                    type: 'text',
                    text: sequence.value,
                    styles: {}
                })
                sourceContent.push({
                    type: 'text',
                    text: sequence.value,
                    styles: {}
                })
            }
        }
        return [sourceContent, correctedContent]
    }
}

export default diffText;
