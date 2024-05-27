import { useEffect, useState } from "react";
import "@blocknote/core/fonts/inter.css";
import {
  BlockNoteView,
  useCreateBlockNote,
  FormattingToolbarController,
} from "@blocknote/react";
import "@blocknote/react/style.css";
import "./App.css";
import {
  ChatCompletionMessageParam,
  CreateWebWorkerEngine,
  EngineInterface,
  InitProgressReport,
  hasModelInCache,
} from "@mlc-ai/web-llm";
import { transformateurJsonToString } from "./utils/ParserBlockToString";
import { Block, BlockNoteEditor } from "@blocknote/core";
import { CustomFormattingToolbar } from "./components/CustomFormattingToolbar";
import { appConfig } from "./app-config";
import { MODEL_DESCRIPTIONS, Model } from "./models";
import {
  addBlock,
  duplicateEditor,
  getEditorBlocks,
  updateBlock,
  updateContentBlock,
} from "./utils/blockManipulation";
import correctSingleBlock from "./utils/correctSingleBlock";
import diffText from "./utils/diffText";
import { systemPrompt } from "./prompt";

const Demo = () => {
  const [engine, setEngine] = useState<EngineInterface | null>(null);
  const [progress, setProgress] = useState("Not loaded");
  const [test, setTest] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>(
    Model.LLAMA_3_8B_INSTRUCT_Q4F16_1
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProccess, setCurrentProcess] = useState<
    "translation" | "correction" | "resume" | "developpe" | null
  >(null);
  const [translation, setTranslation] = useState<boolean>(false);

  const [runtimeStats, setRuntimeStats] = useState("");

  const IS_MODEL_STATUS_CHECK_ENABLED = false;

  const updateModelStatus = async () => {
    console.log("Checking model status");
    Object.values(Model).forEach(async (model) => {
      const isInCache = await hasModelInCache(model, appConfig);
      console.log(`${model} in cache: ${isInCache}`);
    });
  };

  useEffect(() => {
    if (IS_MODEL_STATUS_CHECK_ENABLED) {
      updateModelStatus();
    }
  }, []);

  const editorFrench = useCreateBlockNote();
  const editorEnglish = useCreateBlockNote({
    initialContent: editorFrench.document,
  });

  const initProgressCallback = (report: InitProgressReport) => {
    //console.log(report);
    setProgress(report.text);
  };

  const loadEngine = async () => {
    console.log("Loading engine");

    const engine: EngineInterface = await CreateWebWorkerEngine(
      new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      }),
      selectedModel,
      { initProgressCallback: initProgressCallback, appConfig: appConfig }
    );
    setEngine(engine);
    return engine;
  };

  type updateEditor = (
    text: string,
    editor?: BlockNoteEditor,
    idBlock?: string,
    textColor?: string
  ) => void;

  const onSend = async (
    loadedEngine: EngineInterface,
    prompt: string,
    task: "translation" | "correction" | "resume" | "developpe",
    updateEditor: updateEditor
  ) => {
    if (prompt === "") {
      return;
    }
    setIsGenerating(true);

    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: systemPrompt[task],
    };

    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: prompt,
    };
    setTest("");

    // if (!loadedEngine) {
    // 	console.log('Engine not loaded');

    // 	try {
    // 		loadedEngine = await loadEngine();
    // 	} catch (error) {
    // 		setIsGenerating(false);
    // 		console.log(error);
    // 		setTest('Could not load the model because ' + error);
    // 		return;
    // 	}
    // }

    try {
      console.log(systemMessage);
      const completion = await loadedEngine.chat.completions.create({
        stream: true,
        messages: [systemMessage, userMessage],
      });

      let assistantMessage = "";
      for await (const chunk of completion) {
        const curDelta = chunk.choices[0].delta.content;
        if (curDelta) {
          assistantMessage += curDelta;
        }
        updateEditor(assistantMessage);
      }
      const text = await loadedEngine.getMessage();
      setIsGenerating(false);
      setCurrentProcess(null);
      setRuntimeStats(await loadedEngine.runtimeStatsText());
      console.log(await loadedEngine.runtimeStatsText());
      return text;
    } catch (e) {
      setIsGenerating(false);
      console.log("EXECPTION");
      console.log(e);
      setTest("Error. Try again.");
      return;
    }
  };

  // const resetChat = async () => {
  // 	if (!engine) {
  // 		console.log('Engine not loaded');
  // 		return;
  // 	}
  // 	await engine.resetChat();
  // 	setTest('');
  // };

  // const resetEngineAndChatHistory = async () => {
  // 	if (engine) {
  // 		await engine.unload();
  // 	}
  // 	setEngine(null);
  // 	setTest('');
  // };

  // const onStop = () => {
  // 	if (!engine) {
  // 		console.log('Engine not loaded');
  // 		return;
  // 	}

  // 	setIsGenerating(false);
  // 	engine.interruptGenerate();
  // };

  const translate = async () => {
    let loadedEngine = engine;
    const markdown = await editorFrench.blocksToMarkdownLossy(
      editorFrench.document
    );
    const neweditor = await editorFrench.tryParseMarkdownToBlocks(markdown);
    editorFrench.replaceBlocks(editorFrench.document, neweditor);
    const idBlock = await duplicateEditor(
      editorFrench,
      editorEnglish,
      "Traduction en cours…"
    );
    for (const id of idBlock) {
      const block = editorFrench.getBlock(id);
      let text = "";
      if (block) {
        text = transformateurJsonToString(block);
      }
      if (text !== "") {
        setIsGenerating(true);
        loadedEngine = await ensureEngineLoaded(loadedEngine);
        const prompt = "Tu peux me traduire ce texte en anglais : " + text;
        await onSend(
          loadedEngine,
          prompt,
          "translation",
          (translatedText: string) => {
            updateBlock(editorEnglish, id, translatedText, "red");
          }
        );
      }
    }
  };

  const ensureEngineLoaded = async (currentEngine: EngineInterface | null) => {
    if (currentEngine) {
      return currentEngine;
    }

    console.log("Engine not loaded");
    try {
      const loadedEngine = await loadEngine();
      return loadedEngine;
    } catch (error) {
      setIsGenerating(false);
      console.log(error);
      setTest("Could not load the model because " + error);
      throw new Error("Could not load the model because " + error);
    }
  };

  const Correction = async () => {
    let loadedEngine = engine;
    const markdown = await editorFrench.blocksToMarkdownLossy(
      editorFrench.document
    );
    const neweditor = await editorFrench.tryParseMarkdownToBlocks(markdown);
    editorFrench.replaceBlocks(editorFrench.document, neweditor);
    const idBlocks = await duplicateEditor(
      editorFrench,
      editorEnglish,
      "Correction en cours…"
    );

    for (const id of idBlocks) {
      const block = editorFrench.getBlock(id);
      let text = "";
      if (block) {
        text = transformateurJsonToString(block);
      }
      if (text !== "") {
        setIsGenerating(true);
        loadedEngine = await ensureEngineLoaded(loadedEngine);
        await correctSingleBlock(
          block,
          editorEnglish.getBlock(id),
          editorFrench,
          editorEnglish,
          onSend,
          loadedEngine
        );
        // const prompt =
        // 	"Je veux que tu recopies mot pour mot ce texte en corrigeant les fautes d'orthographes : " +
        // 	text;
        // await onSend(prompt, (text: string) =>
        // 	updateBlock(editorEnglish, id, text, 'red')
        // );
      }
    }
  };

  // const correctSingleBlock = async (
  // 	block: Block,
  // 	id: string,
  // 	loadedEngine: EngineInterface
  // ) => {
  // 	let text = '';

  // 	if (Array.isArray(block.content)) {
  // 		for (const sequence of block.content) {
  // 			if ('text' in sequence) {
  // 				text += sequence['text'];
  // 			}
  // 		}
  // 	}
  // 	const prompt =
  // 		'Ce texte contient des fautes, corrige-les sans jamais changer les mots qu’il contient ni la ponctuation : ' +
  // 		text;
  // 	await onSend(loadedEngine, prompt, (correctedText: string) => {
  // 		const [sourceContent, correctedContent] = diffText(text, correctedText);
  // 		updateContentBlock(editorFrench, id, sourceContent);
  // 		updateBlock(editorEnglish, id, correctedContent, 'red');
  // 	});
  // };

  const Resume = async () => {
    const markdown = await editorFrench.blocksToMarkdownLossy(
      editorFrench.document
    );
    const neweditor = await editorFrench.tryParseMarkdownToBlocks(markdown);
    editorFrench.replaceBlocks(editorFrench.document, neweditor);
    const idBlocks = getEditorBlocks(editorFrench).reverse();
    let texte3 = "";
    let titre1 = "";
    let titre2 = "";
    let titre3 = "";
    let texte2 = "";
    let texte1 = "";
    let text = "";
    let loadedEngine = engine;

    for (const id of idBlocks) {
      const block = editorFrench.getBlock(id);
      setIsGenerating(true);
      loadedEngine = await ensureEngineLoaded(loadedEngine);
      if (block) {
        if (block.type === "heading") {
          if (block.props.level === 3) {
            titre3 = transformateurJsonToString(block);
            if (texte3 !== "") {
              const prompt =
                " Résume ce texte si besoin: " +
                texte3 +
                " sachant que c'est une sous-partie de :" +
                titre3;
              const res = await onSend(
                loadedEngine,
                prompt,
                "resume",
                (text: string) => {
                  console.log(text);
                }
              );
              texte2 += res;
            }
          } else if (block.props.level === 2) {
            if (texte2 + texte3 !== "") {
              titre2 = transformateurJsonToString(block);
              const prompt =
                " Résume ce texte si besoin: " +
                texte2 +
                texte3 +
                " sachant que c'est une sous-partie de :" +
                titre2;
              const res = await onSend(
                loadedEngine,
                prompt,
                "resume",
                (text: string) => {
                  console.log(text);
                }
              );
              texte1 += res;

              texte2 = "";
              texte3 = "";
            }
          } else if (block.props.level === 1) {
            if (texte1 + texte2 + texte3 !== "") {
              titre1 = transformateurJsonToString(block);
              const prompt =
                " Résume ce texte si besoin: " +
                texte1 +
                texte2 +
                texte3 +
                " sachant que c'est une sous-partie de :" +
                titre1;
              const res = await onSend(
                loadedEngine,
                prompt,
                "resume",
                (text: string) => {
                  console.log(text);
                }
              );
              text = res ?? "";

              texte1 = "";
              texte2 = "";
              texte3 = "";
            }
          }
        } else {
          texte3 = transformateurJsonToString(block) + texte3;
        }
      }
    }
    if (text + texte1 + texte2 + texte3 !== "") {
      setIsGenerating(true);
      loadedEngine = await ensureEngineLoaded(loadedEngine);
      const prompt =
        " Résume ce texte si besoin: " + text + texte1 + texte2 + texte3;
      const res = await onSend(
        loadedEngine,
        prompt,
        "resume",
        (text: string) => {
          console.log(text);
        }
      );

      if (res) {
        addBlock(
          editorFrench,
          idBlocks[idBlocks.length - 1],
          "Voici le résumé du document : \n " + res,
          "blue",
          "before"
        );
      }
    }
  };

  const Developpe = async () => {
    const markdown = await editorFrench.blocksToMarkdownLossy(
      editorFrench.document
    );
    const neweditor = await editorFrench.tryParseMarkdownToBlocks(markdown);
    editorFrench.replaceBlocks(editorFrench.document, neweditor);
    const idBlocks = getEditorBlocks(editorFrench);
    let text = "";
    let loadedEngine = engine;
    for (const id of idBlocks) {
      const block = editorFrench.getBlock(id);
      if (block) {
        text += transformateurJsonToString(block);
      }
    }
    if (text !== "") {
      setIsGenerating(true);
      loadedEngine = await ensureEngineLoaded(loadedEngine);
      const prompt = "Développe un texte à partir de ces éléments : " + text;
      const dev = await onSend(
        loadedEngine,
        prompt,
        "developpe",
        (text: string) => {
          console.log(text);
        }
      );
      if (dev) {
        addBlock(
          editorFrench,
          idBlocks[idBlocks.length - 1],
          "Voici le développement du document : " + dev,
          "blue",
          "after"
        );
      }
    }
  };

  return (
    <>
      <div>{test}</div>
      {/* <button onClick={resetChat}>Send</button> */}

      {/*<div>
				{Object.values(Model).map((model, index) => (
					<div key={index}>
						<div>{model}</div>
						<span>{modelsState[model] ? 'Cached' : 'Not Cached'}</span>
					</div>
				))}
				</div>*/}
      {/* <div className='chatui-select-wrapper'>
				<select
					id='chatui-select'
					value={selectedModel}
					onChange={(selectedModel) => {
						setSelectedModel(selectedModel.target.value as Model);
						// resetEngineAndChatHistory();
					}}
				>
					{Object.values(Model).map((model) => (
						<option key={model} value={model}>
							{MODEL_DESCRIPTIONS[model].icon}{' '}
							{MODEL_DESCRIPTIONS[model].displayName}
						</option>
					))}
				</select>
			</div> */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <button onClick={loadEngine}>Load</button>
        <div>{progress}</div>
      </div>
      <div className="translate-button">
        {currentProccess === "translation" && (
          <p>Document en cours de traduction…</p>
        )}
        {currentProccess === "correction" && (
          <p>Document en cours de corrrection…</p>
        )}
        {runtimeStats && <p>Vitesse : {runtimeStats}</p>}
        <div style={{ display: "flex", gap: "20px" }}>
          <button
            disabled={currentProccess !== null || isGenerating}
            onClick={() => {
              setCurrentProcess("translation");
              setTranslation(true);
              translate();
            }}
          >
            Traduire le document
          </button>
          <button
            disabled={currentProccess !== null}
            onClick={() => {
              setCurrentProcess("correction");
              setTranslation(true);
              // setTranslation(true);
              Correction();
            }}
          >
            Corriger le document
          </button>
          <button
            disabled={currentProccess !== null}
            onClick={() => {
              setCurrentProcess("resume");
              Resume();
            }}
          >
            Resumer le document
          </button>
          <button
            disabled={currentProccess !== null}
            onClick={() => {
              setCurrentProcess("developpe");
              Developpe();
            }}
          >
            Développer le document
          </button>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        {isGenerating && <div>Chargement de la réponse...</div>}
      </div>
      <div className="blocknote-container">
        <BlockNoteView
          editor={editorFrench}
          className={
            translation ? "blocknote-french" : "blocknote-french full-width"
          }
          formattingToolbar={false}
        >
          <FormattingToolbarController
            formattingToolbar={() => (
              <CustomFormattingToolbar onSend={onSend} />
            )}
          />
        </BlockNoteView>
        {translation && (
          <BlockNoteView editor={editorEnglish} className="blocknote-english" />
        )}
      </div>
    </>
  );
};
export default Demo;
