import { ExtensionContext, commands, window } from "vscode";
import { IWindow } from "./interfaces/window.interface";
import { getClassName, getCurrentLine, getInheritedNames, getNamespace, getMethodSignatureText, getPropertySignatureText } from "./utils/csharp-util";
import { isTextEditorOpen, isTextInEditor, isWorkspaceLoaded } from "./utils/workspace-util";

export const execute = (workspaceRoot: string, window: IWindow, context: ExtensionContext) => {
  console.log('🚀 ~ execute ~ workspaceRoot:', workspaceRoot);
  if (!isWorkspaceLoaded(workspaceRoot, window)) { return; };
  if (!isTextEditorOpen(window)) { return; };

  const editor = window.activeTextEditor;
  const text = editor.document.getText();
  if (!isTextInEditor(text, window)) { return; };

  const namespace = getNamespace(text, window);
  if (!namespace) { return; };
  const className = getClassName(text, window);
  if (!className) { return; };

  const inheritedNames = getInheritedNames(text, false, window);
  console.log('🚀 ~ execute ~ inheritedNames:', inheritedNames);

};
