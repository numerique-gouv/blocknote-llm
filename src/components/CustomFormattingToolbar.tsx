import { BasicTextStyleButton, BlockTypeSelect, ColorStyleButton, CreateLinkButton, FormattingToolbar, ImageCaptionButton, NestBlockButton, ReplaceImageButton, TextAlignButton, UnnestBlockButton } from "@blocknote/react";
import { TranslateToolbarButton } from "./TranslateToolbarButton";
import { CorrectToolbarButton } from "./CorrectToolbarButton";
import { EngineInterface } from "@mlc-ai/web-llm";

export function CustomFormattingToolbar({ onSend, engine }: { onSend: () => void, engine: EngineInterface}) {
    return (
        <FormattingToolbar>
            <BlockTypeSelect key={"blockTypeSelect"} />
    
            {/* Extra button to toggle blue text & background */}
            <TranslateToolbarButton key={"translateButton"} onSend={onSend} engine={engine}/>
            <CorrectToolbarButton key={"correctButton"} onSend={onSend} engine={engine}/>
    
            <ImageCaptionButton key={"imageCaptionButton"} />
            <ReplaceImageButton key={"replaceImageButton"} />
    
            <BasicTextStyleButton
                basicTextStyle={"bold"}
                key={"boldStyleButton"}
            />
            <BasicTextStyleButton
                basicTextStyle={"italic"}
                key={"italicStyleButton"}
            />
            <BasicTextStyleButton
                basicTextStyle={"underline"}
                key={"underlineStyleButton"}
            />
            <BasicTextStyleButton
                basicTextStyle={"strike"}
                key={"strikeStyleButton"}
            />
            {/* Extra button to toggle code styles */}
            <BasicTextStyleButton
                key={"codeStyleButton"}
                basicTextStyle={"code"}
            />
    
            <TextAlignButton
                textAlignment={"left"}
                key={"textAlignLeftButton"}
            />
            <TextAlignButton
                textAlignment={"center"}
                key={"textAlignCenterButton"}
            />
            <TextAlignButton
                textAlignment={"right"}
                key={"textAlignRightButton"}
            />
    
            <ColorStyleButton key={"colorStyleButton"} />
    
            <NestBlockButton key={"nestBlockButton"} />
            <UnnestBlockButton key={"unnestBlockButton"} />
    
            <CreateLinkButton key={"createLinkButton"} />
        </FormattingToolbar>
    )
}