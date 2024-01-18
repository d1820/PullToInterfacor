import { WorkspaceFolder, TextEditor } from 'vscode';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getWorkspaceFolder } from './utils/workspace-util';
import * as csharp from './pull-to-interface-csharp';
import { IWindow } from './interfaces/window.interface';
import { SignatureType, cleanExcessiveNewLines, getLineEnding, getMemberName, getUsingStatements } from './utils/csharp-util';


const extensionName = 'pulltointerfacor.pullto';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export  function activate(context: vscode.ExtensionContext) {
  var wsf = vscode.workspace.workspaceFolders;
  const workspaceRoot: string = getWorkspaceFolder(wsf as WorkspaceFolder[]);
  let disposable = vscode.commands.registerTextEditorCommand(extensionName, async (editor) => {
    if (editor && editor.document.languageId === 'csharp') {
      const subCommands = await csharp.getSubCommandsAsync(workspaceRoot, vscode.window as IWindow);
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

        //TODO get this to work
        if (!subcommand.startsWith("I") && signatureResult?.signatureType === SignatureType.Method) {
          vscode.window.showErrorMessage(`Unsupported pull. Pulling methods to a base class (${subcommand}) is not supported. Please copy method manually`);
          return;
        }

        if (!signatureResult?.signature || signatureResult.signatureType === SignatureType.Unknown) {
          vscode.window.showErrorMessage(`Unsupported pull. Unable to determine what to pull. 'public' methods and properties are only supported. Please copy manually`);
          return;
        }

        //read file contents
        const files = await vscode.workspace.findFiles(`**/${subcommand}.cs`, '**/node_modules/**');
        if (files.length > 1) {
          vscode.window.showErrorMessage(`More then one file found matching ${subcommand}. Please copy manually`);
          return;
        }

        const interfaceDocument = await vscode.workspace.openTextDocument(files[0].path);
        let interfaceDocumentContent = interfaceDocument.getText();
        if (!interfaceDocumentContent) {
          vscode.window.showErrorMessage(`Unable to parse file ${subcommand}. Please copy manually`);
          return;
        }
        const eol = getLineEnding(editor);
        if (interfaceDocumentContent.indexOf(signatureResult.signature.trim()) > -1) {
          vscode.window.showWarningMessage(`Member already in ${subcommand}. Skipping pull`);
          return;
        } else {
          interfaceDocumentContent = csharp.addMemberToInterface(subcommand, signatureResult, eol, interfaceDocumentContent);
          if (interfaceDocumentContent) {
            const currentDocumentUsings = getUsingStatements(editor);
            interfaceDocumentContent = csharp.addUsingsToInterface(eol, interfaceDocumentContent, currentDocumentUsings)
            interfaceDocumentContent = cleanExcessiveNewLines(interfaceDocumentContent);
            const success = await csharp.applyEditsAsync(files[0].path, interfaceDocumentContent);
            if (!success) {
              vscode.window.showErrorMessage(`Unable to update ${subcommand}. Please copy manually`);
              return;
            }

            const wasSaved = await interfaceDocument.save();
            if (!wasSaved) {
              vscode.window.showWarningMessage(`Unable to save updates to ${subcommand}. Please save file manually`);
              return;
            }
            const memberName = getMemberName(signatureResult!.signature);
            vscode.window.showInformationMessage(`${memberName} pulled to ${subcommand}`);
          } else {
            vscode.window.showErrorMessage(`Unable to parse file ${subcommand}. Please copy manually`);
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
