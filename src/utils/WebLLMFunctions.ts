import { InitProgressReport } from "@mlc-ai/web-llm";
import useChatStore from "../hooks/useChatStore";

const userInput = useChatStore((state) => state.userInput)

export const initProgressCallback = (report: InitProgressReport) => {

}