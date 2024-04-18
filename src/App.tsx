import "./App.css";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView, useCreateBlockNote } from "@blocknote/react";
import "@blocknote/react/style.css";
import { useState } from "react";
import { Block } from "@blocknote/core";

function App() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  const editor = useCreateBlockNote();

  const transformateurJsonToString = (block) => {
    let string = [];
    console.log(block);
    for (let i = 0; i < block.length; i++) {
      let paragraph = "";
      if (block[i].type === "table") {
        for (let j = 0; j < block[i].content.rows.length; j++) { 
          for (let k = 0; k < block[i].content.rows[j].cells.length; k++) {
            string.push(block[i].content.rows[j].cells[k]);
            let table = "";
            table += block[i].content.rows[j].cells[k].text;
            string.push(table);
          }
        }
      } else {
        for (let j = 0; j < block[i].content.length; j++) {
          paragraph += block[i].content[j].text;
        }
      }
      string.push(paragraph);
    }
    //console.log(string);
    return string;
  };

  return (
    <div>
      <div>
        <BlockNoteView
          editor={editor}
          sideMenu={true}
          onChange={() => {
            // Saves the document JSON to state.
            setBlocks(editor.document);
          }}
        />
      </div>
      {transformateurJsonToString(blocks).map((item, index) => (
        <p key={index}>{item}</p>
      ))}
      <div>Document JSON:</div>
      <div className={"item bordered"}>
        <pre>
          <code>{JSON.stringify(blocks, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
}

export default App;
