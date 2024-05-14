import { useState } from "react";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView, useCreateBlockNote } from "@blocknote/react";
import "@blocknote/react/style.css";
import "./App.css";
import { Engine } from "@mlc-ai/web-llm";
import ChatUI from "./ChatUI";
import { transformateurJsonToString } from "./utils/ParserBlockToString";
import { BlockNoteEditor } from "@blocknote/core";

const Demo = () => {
  const [disabled, setDisabled] = useState<boolean>(false);
  const [disabled2, setDisabled2] = useState<boolean>(false);
  const [translation, setTranslation] = useState<boolean>(false);
  const [pedone, setPedone] = useState<string>("");
  //const [translationCount, setTranslationCount] = useState<number>(0);

  const [messages, setMessages] = useState<{ kind: string; text: string }[]>(
    []
  );
  const [runtimeStats, setRuntimeStats] = useState("");
  const [chat_ui] = useState(new ChatUI(new Engine()));

  const editorFrench = useCreateBlockNote();
  const editorEnglish = useCreateBlockNote({
    initialContent: editorFrench.document,
  });

  const updateMessage = (kind: string, text: string, append: boolean) => {
    if (kind == "init") {
      text = "[System Initalize] " + text;
    }
    const msgCopy = [...messages];
    if (msgCopy.length == 0 || append) {
      setMessages([...msgCopy, { kind, text }]);
    } else {
      msgCopy[msgCopy.length - 1] = { kind, text };
      setMessages([...msgCopy]);
    }
  };

  const translate = async () => {
    const idBlock = await duplicateEditor(editorFrench, editorEnglish);
    for (const id of idBlock) {
      const block = editorFrench.getBlock(id);
      let text = "";
      if (block) {
        text = transformateurJsonToString(block);
      }
      if (text !== "") {
        const prompt = "Tu peux me traduire ce texte en anglais : " + text;
        chat_ui
          .onGenerateTranslation(
            prompt,
            updateMessage,
            updateBlock,
            editorEnglish,
            id,
            setRuntimeStats,
            setDisabled
          )
          .catch((error) => console.log(error));

        // editorEnglish.updateBlock(id, {
        // 	content: [
        // 		{
        // 			type: 'text',
        // 			text: '',
        // 			styles: { textColor: 'red' },
        // 		},
        // 	],
        // });
      }
    }
  };

  const Correction = async () => {
    const idBlocks = getEditorBlocks(editorFrench);
    for (const id of idBlocks) {
      const block = editorFrench.getBlock(id);
      let text = "";
      if (block) {
        text = transformateurJsonToString(block);
      }
      if (text !== "") {
        const prompt =
          "Je veux que tu recopies mot pour mot ce texte en corrigeant les fautes d'orthographes : " +
          text;
        chat_ui
          .onGenerateCorrection(
            prompt,
            updateMessage,
            addBelowBlock,
            editorFrench,
            id,
            setRuntimeStats,
            setDisabled2
          )
          .catch((error) => console.log(error));
      }
    }
  };

  const Resume = async () => {
    const idBlocks = getEditorBlocks(editorFrench).reverse();
    let texte3 = "";
    let titre1 = "";
    let titre2 = "";
    let titre3 = "";
    let texte2 = "";
    let texte1 = "";
    let text = "";

    for (const id of idBlocks) {
      const block = editorFrench.getBlock(id);
      if (block.type === "heading") {
        if (block.props.level === 3) {
          titre3 = transformateurJsonToString(block);
          if (texte3 !== "") {
            let prompt =
              " Résume ce texte si besoin: " +
              texte3 +
              " sachant que c'est une sous-partie de :" +
              titre3;
            texte2 += "biberon2";
            // `
            // ` +
            // chat_ui
            // .onGenerateCorrection(
            // 	prompt,
            // 	updateMessage,
            // 	addBelowBlock,
            // 	editorFrench,
            // 	id,
            // 	setRuntimeStats,
            // 	setDisabled2
            // )
            // .catch((error) => console.log(error));
            // texte3 = '';
          }
        } else if (block.props.level === 2) {
          if (texte2 + texte3 !== "") {
            titre2 = transformateurJsonToString(block);
            let prompt =
              " Résume ce texte si besoin: " +
              texte2 +
              texte3 +
              " sachant que c'est une sous-partie de :" +
              titre2;
            texte1 += "biberon1";
            // chat_ui
            // .onGenerateCorrection(
            // 	prompt,
            // 	updateMessage,
            // 	addBelowBlock,
            // 	editorFrench,
            // 	id,
            // 	setRuntimeStats,
            // 	setDisabled2
            // )
            // .catch((error) => console.log(error));
            texte2 = "";
            texte3 = "";
          }
        } else if (block.props.level === 1) {
          if (texte1 + texte2 + texte3 !== "") {
            titre1 = transformateurJsonToString(block);
            let prompt =
              " Résume ce texte si besoin: " +
              texte1 +
              texte2 +
              texte3 +
              " sachant que c'est une sous-partie de :" +
              titre1;
            text = "biberon0";
            // chat_ui
            // .onGenerateCorrection(
            // 	prompt,
            // 	updateMessage,
            // 	addBelowBlock,
            // 	editorFrench,
            // 	id,
            // 	setRuntimeStats,
            // 	setDisabled2
            // )
            // .catch((error) => console.log(error));
            texte1 = "";
            texte2 = "";
            texte3 = "";
          }
        }
      } else {
        texte3 += transformateurJsonToString(block);
      }
	}
    if (text + texte1 + texte2 + texte3 !== "") {
      let prompt =
        " Résume ce texte si besoin: " + text + texte1 + texte2 + texte3;
      setPedone(text + texte1 + texte2 + texte3);
      return text + texte1 + texte2 + texte3;
      // chat_ui
      // .onGenerateCorrection(
      // 	prompt,
      // 	updateMessage,
      // 	addBelowBlock,
      // 	editorFrench,
      // 	id,
      // 	setRuntimeStats,
      // 	setDisabled2
      // )
      // .catch((error) => console.log(error));
    }

  };

  const getEditorBlocks = (editor: BlockNoteEditor) => {
    const idBlocks: string[] = [];
    editor.forEachBlock((block) => {
      const text = transformateurJsonToString(block);
      if (text !== "") {
        idBlocks.push(block.id);
      }
      return true;
    });
    return idBlocks;
  };

  const duplicateEditor = async (
    initialEditor: BlockNoteEditor,
    duplicateEditor: BlockNoteEditor
  ) => {
    const idBlocks: string[] = [];
    await initialEditor.tryParseMarkdownToBlocks(""); //Fix bug
    duplicateEditor.replaceBlocks(
      duplicateEditor.document,
      initialEditor.document
    );
    initialEditor.forEachBlock((block) => {
      const text = transformateurJsonToString(block);
      if (text !== "") {
        idBlocks.push(block.id);
        duplicateEditor.updateBlock(block.id, {
          content: [
            {
              type: "text",
              text: "Traduction en cours ...",
              styles: { textColor: "red" },
            },
          ],
        });
      }
      return true;
    });
    return idBlocks;
  };

  const updateBlock = (
    editor: BlockNoteEditor,
    blockId: string,
    text: string
  ) => {
    const block = editor.getBlock(blockId);
    if (block) {
      editor.updateBlock(blockId, {
        content: [
          {
            type: "text",
            text: text,
            styles: { textColor: "red" },
          },
        ],
      });
    }
  };

  const addBelowBlock = (
    editor: BlockNoteEditor,
    blockId: string,
    text: string
  ) => {
    const block = editor.getBlock(blockId);
    if (block) {
      editor.insertBlocks(
        [
          {
            content: [
              {
                type: "text",
                text: text,
                styles: { textColor: "red" },
              },
            ],
          },
        ],
        blockId,
        "after"
      );
    }
  };

  return (
    <>
      <button onClick={Resume}>Pedone</button>
      <div>{pedone}</div>
      <div className="translate-button">
        {disabled && <p>Document en cours de traduction ...</p>}
        {disabled2 && <p>Document en cours de corrrection ...</p>}
        {runtimeStats && <p>Vitesse : {runtimeStats}</p>}
        <div style={{ display: "flex", gap: "20px" }}>
          <button
            disabled={disabled}
            onClick={() => {
              setDisabled(true);
              setTranslation(true);
              translate();
            }}
          >
            Traduire le document
          </button>
          <button
            disabled={disabled2}
            onClick={() => {
              setDisabled2(true);
              // setTranslation(true);
              Correction();
            }}
          >
            Corriger le document
          </button>
        </div>
      </div>
      <div className="blocknote-container">
        <BlockNoteView
          editor={editorFrench}
          className={
            translation ? "blocknote-french" : "blocknote-french full-width"
          }
        />
        {translation && (
          <BlockNoteView editor={editorEnglish} className="blocknote-english" />
        )}
      </div>
    </>
  );
};
export default Demo;
