function diffText(originalText: string, correctedText: string) {
    const originalWords = originalText.split(/[   ]/)
    const correctedWords = correctedText.split(/[   ]/)
    var formattedSourceContent = []
    var formattedCorrectedContent = []
    for (let index = 0; index < correctedWords.length && index < originalWords.length; index++) {
        const correctedWord = correctedWords[index];
        const originalWord = originalWords[index]
        if (correctedWord === originalWord) {
            formattedSourceContent.push({
                "type": "text",
                "text": originalWord + " ",
                "styles": {}
            })
            formattedCorrectedContent.push({
                "type": "text",
                "text": originalWord + " ",
                "styles": {}
            })
        }
        else {
            formattedSourceContent.push({
                "type": "text",
                "text": originalWord + " ",
                "styles": {"backgroundColor": "red"}
            })
            formattedCorrectedContent.push({
                "type": "text",
                "text": correctedWord + " ",
                "styles": {"backgroundColor": "green"}
            })
        }
    }

    for (let index = correctedWords.length; index < originalWords.length; index++) {
        const word = originalWords[index];
        formattedSourceContent.push({
            "type": "text",
            "text": word + " ",
            "styles": {}
        })
    }

    return [formattedSourceContent, formattedCorrectedContent]
}

export default diffText