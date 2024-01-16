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
  console.log('🚀 ~ execute ~ namespace:', namespace);
  if (!namespace) { return; };
  const className = getClassName(text, window);
  console.log('🚀 ~ execute ~ className:', className);
  if (!className) { return; };

  const inheritedNames = getInheritedNames(text, window);
  console.log('🚀 ~ execute ~ inheritedNames:', inheritedNames);

  const currentLine = getCurrentLine(editor);
  console.log('🚀 ~ execute ~ currentLine:', currentLine);

  const methodSignature = getMethodSignatureText(editor);
  console.log('🚀 ~ execute ~ methodSignature:', methodSignature);

  const propertySignature = getPropertySignatureText(editor);
  console.log('🚀 ~ execute ~ propertySignature:', propertySignature);

};

const buildSubCommands = async (context: ExtensionContext) => {
  const subcommands = ['subcommand1', 'subcommand2', 'subcommand3'];

  // Register each subcommand
  subcommands.forEach(subcommand => {
    const disposable = commands.registerCommand(`extension.${subcommand}`, () => {
      window.showInformationMessage(`Executing subcommand: ${subcommand}`);
    });

    context.subscriptions.push(disposable);
  });

  // Show a quick pick to execute subcommands
  const chosenSubcommand = await window.showQuickPick(subcommands);

  // Execute the chosen subcommand
  if (chosenSubcommand) {
    commands.executeCommand(`extension.${chosenSubcommand}`);
  }
}
