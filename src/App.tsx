import React, { useState, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Allotment } from 'allotment';
import MonacoEditor from 'react-monaco-editor';
import { editor } from 'monaco-editor';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import 'allotment/dist/style.css';
import './App.css';

function MainWindow() {
  const [selectedText, setSelectedText] = useState<string>('');
  const [language, setLanguage] = useState<string>('xml');
  const [theme, setTheme] = useState<string>('vs-dark');
  const [regex, setRegex] = useState<string>(
    '.*(\\[\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}\\]).*?(\\[(?:INFO| INFO|ERROR|DEBUG|WARNING)\\])\\s?(.*)',
  );
  const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    const editorInstance = editorRef.current;
    if (!editorInstance) return;

    const lastOpenedText = localStorage.getItem('lastOpenedText');
    if (lastOpenedText) {
      editorInstance.setValue(lastOpenedText);
    }
  }, []);

  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    selectOnLineNumbers: true,
    roundedSelection: true,
    readOnly: false,
    cursorStyle: 'block-outline',
    automaticLayout: true,
    wordWrap: 'off',
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    fontSize: 11,
    selectionHighlight: true,
  };
  const handleRegexButtonClick = () => {
    const editorInstance = editorRef.current;
    if (!editorInstance) return;

    const re = new RegExp(regex);
    const lines = editorInstance.getValue().split('\n');
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(re);
      if (match) {
        const groups = match.slice(1);
        lines[i] = groups.join(' ');
      }
    }
    lines.sort();
    const newText = lines.join('\n');

    editorInstance.setValue(newText);
  }; // eslint-disable-line no-plusplus

  const handleSaveTextButtonClick = () => {
    const editorInstance = editorRef.current;
    if (!editorInstance) return;
    const currentText = editorInstance.getValue();
    localStorage.setItem('lastOpenedText', currentText);
  };

  const prettyPrint = (text: string) => {
    try {
      const json = JSON.parse(text);
      return { text: JSON.stringify(json, null, 3), language: 'json' };
    } catch (e) {} // eslint-disable-line no-empty
    try {
      const parserOptions = {
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        allowBooleanAttributes: true,
        parseAttributeValue: true,
      };
      const parser = new XMLParser(parserOptions);
      const xml = parser.parse(text);
      const builderOptions = {
        format: true,
        indentBy: '   ',
        suppressEmptyNode: true,
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
      };
      const builder = new XMLBuilder(builderOptions);
      return { text: builder.build(xml), language: 'xml' };
    } catch (e) {
      return { text, language: 'plaintext' };
    }
  };

  const handleSelectionChange = (value: string) => {
    let textToParse = value;
    const xmlMatch = value.match(/<.*>/);
    const jsonMatch = value.match(/{.*}/);

    if (xmlMatch) {
      textToParse = xmlMatch[0]; // eslint-disable-line prefer-destructuring
    } else if (jsonMatch) {
      textToParse = jsonMatch[0]; // eslint-disable-line prefer-destructuring
    }

    const prettyText = prettyPrint(textToParse);
    setSelectedText(prettyText.text);
    setLanguage(prettyText.language);
  };

  return (
    <div
      style={{
        height: '100vh',
        backgroundColor: 'rgb(30, 30, 30)',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgb(30, 30, 30)',
          borderBottom: '1px solid rgb(64, 64, 64)',
          height: '40px',
        }}
        className="text-white py-2 px-1 flex items-center space-x-2"
      >
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{
            backgroundColor: 'rgb(50, 50, 50)',
            color: 'rgb(204, 204, 204)',
            height: '24px',
          }}
          className="text-xs py-1 px-2 focus:outline-none"
        >
          <option value="vs">Light</option>
          <option value="vs-dark">Dark</option>
          <option value="hc-black">High Contrast</option>
        </select>
        <input
          type="text"
          value={regex}
          aria-label="RegEx"
          onChange={(e) => setRegex(e.target.value)}
          style={{
            backgroundColor: 'rgb(60, 60, 60)',
            color: 'rgb(204, 204, 204)',
          }}
          className="text-xs py-1 px-2 w-1/3 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleRegexButtonClick}
          style={{
            backgroundColor: 'rgb(60, 60, 60)',
            color: 'rgb(204, 204, 204)',
          }}
          className="text-xs py-1 px-2 focus:outline-none"
        >
          RegEx & Sort
        </button>
        <a
          href="https://regexper.com/#.*%3F%28%5C%5B%5Cd%7B4%7D-%5Cd%7B2%7D-%5Cd%7B2%7D%20%5Cd%7B2%7D%3A%5Cd%7B2%7D%3A%5Cd%7B2%7D%2C%5Cd%7B3%7D%5C%5D%29.*%3F%28%5C%5B%28%3F%3AINFO%7C%20INFO%7CERROR%7CDEBUG%7CWARNING%29%5C%5D%29%28.*%29%0A"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'rgb(204, 204, 204)',
          }}
          className="text-xs py-1 px-2 focus:outline-none"
        >
          ?
        </a>
      </div>
      <div style={{ height: 'calc(100vh - 40px)' }}>
        <Allotment>
          <Allotment.Pane>
            <MonacoEditor
              language="auto"
              theme={theme}
              options={editorOptions}
              onChange={handleSaveTextButtonClick}
              editorDidMount={(editorInstance) => {
                editorRef.current = editorInstance;
                editorInstance.onDidChangeCursorPosition((e) => {
                  const model = editorInstance.getModel();
                  if (model) {
                    const value = model.getLineContent(e.position.lineNumber);
                    handleSelectionChange(value);
                  }
                });
              }}
            />
          </Allotment.Pane>
          <Allotment.Pane>
            <MonacoEditor
              language={language}
              theme={theme}
              options={editorOptions}
              value={selectedText}
            />
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainWindow />} />
      </Routes>
    </Router>
  );
}
