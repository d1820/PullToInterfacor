import { ExtensionContext } from "vscode";
import { IWindow } from "./interfaces/window.interface";
import { getClassName, getInheritedNames, getNamespace } from "./utils/csharp-util";
import { isTextEditorOpen, isTextInEditor, isWorkspaceLoaded } from "./utils/workspace-util";

export const execute = (workspaceRoot: string, window: IWindow, context: ExtensionContext) =>
{
  if (!isWorkspaceLoaded(workspaceRoot, window))
  {
    return;
  };
  if (!isTextEditorOpen(window))
  {
    return;
  };

  const editor = window.activeTextEditor;
  const text = editor.document.getText();
  if (!isTextInEditor(text, window))
  {
    return;
  };

  const namespace = getNamespace(text, window);
  if (!namespace)
  {
    return;
  };

  const className = getClassName(text, window);
  if (!className)
  {
    return;
  };

  const inheritedNames = getInheritedNames(text, false);
};
