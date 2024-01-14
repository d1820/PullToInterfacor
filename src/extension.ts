import { WorkspaceFolder } from 'vscode';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getWorkspaceFolder } from './utils/workspace-util';
import { workspace } from 'vscode';
import { execute } from './pull-to-interface';
import { IWindow } from './interfaces/window.interface';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  var g = workspace.workspaceFolders;
  const workspaceRoot: string = getWorkspaceFolder(g as WorkspaceFolder[]);
  let disposable = vscode.commands.registerTextEditorCommand('pulltointerfacor.pullto', (editor) => {
    if (editor && editor.document.languageId === 'csharp') {
      execute(workspaceRoot, vscode.window as IWindow, context);
    }
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
