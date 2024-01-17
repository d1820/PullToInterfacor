import { WorkspaceFolder, TextEditor } from 'vscode';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getWorkspaceFolder } from './utils/workspace-util';
import * as csharp from './pull-to-interface-csharp';
import { IWindow } from './interfaces/window.interface';
import {  SignatureType, getLineEnding } from './utils/csharp-util';


const extensionName = 'pulltointerfacor.pullto';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  var wsf = vscode.workspace.workspaceFolders;
  const workspaceRoot: string = getWorkspaceFolder(wsf as WorkspaceFolder[]);
  let disposable = vscode.commands.registerTextEditorCommand(extensionName, (editor) => {
    if (editor && editor.document.languageId === 'csharp') {
      const subCommands = csharp.getSubCommands(workspaceRoot, vscode.window as IWindow);
      buildSubCommands(subCommands, context);
    }
  });

  context.subscriptions.push(disposable);
}

const isSubcommandRegisteredAsync = async (subcommand: string): Promise<boolean> => {
  const allCommands = await vscode.commands.getCommands(true);
  return allCommands.includes(subcommand);
};

const buildSubCommands = async (subcommands: string[], context: vscode.ExtensionContext) => {

  // Register each subcommand
  subcommands.forEach(async subcommand => {
    const subCommandName = `${extensionName}.${subcommand}`;
    const isRegistered = await isSubcommandRegisteredAsync(subCommandName);
    if (!isRegistered) {
      const disposable = vscode.commands.registerTextEditorCommand(subCommandName, async (editor) => {
        //check if eligible for pull
        var signatureResult = csharp.getSignatureToPull(editor);
        console.log('🚀 ~ disposable ~ signatureResult:', signatureResult);

        if (!subcommand.startsWith("I") && signatureResult?.signatureType === SignatureType.Method) {
          vscode.window.showErrorMessage(`Unsupported pull. Pulling methods to a base class (${subcommand}) is not supported. Please move method manually`);
          return;
        }

        if (!signatureResult?.signature || signatureResult.signatureType === SignatureType.Unknown) {
          vscode.window.showErrorMessage(`Unsupported pull. Unable to determine what to pull. 'public' methods and properties are only supported. Please move manually`);
          return;
        }

        //read file contents
        const files = await vscode.workspace.findFiles(`**/${subcommand}.cs`, '**/node_modules/**');
        console.log('🚀 ~ disposable ~ files:', files);

        if (files.length > 1) {
          vscode.window.showErrorMessage(`More then one file found matching ${subcommand}. Please move manually`);
          return;
        }

        let interfaceFileContent = await csharp.readContents(files[0].path);
        if (!interfaceFileContent) {
          vscode.window.showErrorMessage(`Unable to parse file ${subcommand}. Please move manually`);
          return;
        }
        const eol = getLineEnding(editor);
        if (interfaceFileContent.indexOf(signatureResult.signature.trim()) > -1) {
          vscode.window.showWarningMessage(`Member already in ${subcommand}. Skipping pull`);
          return;
        } else {
          const addedContent = csharp.addMemberToInterface(subcommand, signatureResult, eol, interfaceFileContent);
          if (addedContent) {
            const success = await csharp.replaceFileContent(files[0].path, addedContent);
            if (!success) {
              vscode.window.showErrorMessage(`Error. Unable to update ${subcommand}. Please move manually`);
              return;
            }
            // Execute the "Format Document" command
            await vscode.commands.executeCommand('editor.action.formatDocument', files[0].path);

            await vscode.workspace.saveAll(false);
            vscode.window.showInformationMessage(`${signatureResult.signature} pulled to ${subcommand}`);
            return;
          } else {
            vscode.window.showErrorMessage(`Unable to parse file ${subcommand}. Please move manually`);
            return;
          }
        }
      });

      context.subscriptions.push(disposable);
    }
  });

  // Show a quick pick to execute subcommands
  const chosenSubcommand = await vscode.window.showQuickPick(subcommands);

  // Execute the chosen subcommand
  if (chosenSubcommand) {
    vscode.commands.executeCommand(`${extensionName}.${chosenSubcommand}`);
  }
};



// This method is called when your extension is deactivated
export function deactivate() { }
