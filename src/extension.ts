import { WorkspaceFolder } from 'vscode';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getWorkspaceFolder } from './utils/workspace-util';
import * as csharp from './pull-to-interface-csharp';
import { IWindow } from './interfaces/window.interface';
import { SignatureLineResult, SignatureType, cleanExcessiveNewLines, getLineEnding, getMemberBodyByBrackets, getMemberBodyBySemiColon, getMemberName, getUsingStatements } from './utils/csharp-util';


const extensionName = 'pulltointerfacor.pullto';
//let allCommands: any = null;
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext)
{
  var wsf = vscode.workspace.workspaceFolders;
  const workspaceRoot: string = getWorkspaceFolder(wsf as WorkspaceFolder[]);

  let disposable = vscode.commands.registerTextEditorCommand(extensionName, async (editor) =>
  {
    if (editor && editor.document.languageId === 'csharp')
    {
      const subCommands = await csharp.getSubCommandsAsync(workspaceRoot, vscode.window as IWindow);
      buildSubCommands(subCommands, context);
    }
    else
    {
      vscode.window.showErrorMessage(`Unsupported pull. Language ${editor.document.languageId} not supported.`);
    }
  });

  context.subscriptions.push(disposable);
}

const isSubcommandRegisteredAsync = async (subcommand: string): Promise<boolean> =>
{
  const allCommands = await vscode.commands.getCommands(true);
  return allCommands.includes(subcommand);
};

const buildSubCommands = async (subcommands: string[], context: vscode.ExtensionContext) =>
{
  // Register each subcommand
  subcommands.forEach(async subcommand =>
  {
    const subCommandName = `${extensionName}.${subcommand}`;
    const isRegistered = await isSubcommandRegisteredAsync(subCommandName);
    if (!isRegistered)
    {
      const disposable = vscode.commands.registerTextEditorCommand(subCommandName, async (editor) =>
      {
        //check if eligible for pull
        var signatureResult = csharp.getSignatureToPull(editor, '(public|protected)');

        if (!signatureResult?.signature || signatureResult.signatureType === SignatureType.Unknown)
        {
          vscode.window.showErrorMessage(`Unsupported pull. Unable to determine what to pull. 'public' properties and 'public' or 'protected' methods are only supported. Please copy manually`);
          return;
        }

        //read file contents
        const files = await vscode.workspace.findFiles(`**/${subcommand}.cs`, '**/node_modules/**');
        if (files.length > 1)
        {
          vscode.window.showErrorMessage(`More then one file found matching ${subcommand}. Please copy manually`);
          return;
        }

        const selectedFileDocument = await vscode.workspace.openTextDocument(files[0].path);
        let selectedFileDocumentContent = selectedFileDocument.getText();
        if (!selectedFileDocumentContent)
        {
          vscode.window.showErrorMessage(`Unable to parse file ${subcommand}. Please copy manually`);
          return;
        }

        if (selectedFileDocumentContent.indexOf(signatureResult.originalSelectedLine.trim()) > -1)
        {
          vscode.window.showWarningMessage(`Member already in ${subcommand}. Skipping pull`);
          return;
        }
        else
        {
          const eol = getLineEnding(editor);

          if (!subcommand.startsWith("I"))
          {
            if (signatureResult?.signatureType === SignatureType.Method)
            {
              let currentLine = editor.document.lineAt(signatureResult.lineMatchStartsOn).text;
              if (currentLine.indexOf("=>") > -1)
              {
                const body = getMemberBodyBySemiColon(editor, signatureResult);
                const methodBodySignature = new SignatureLineResult(body, signatureResult.signatureType, signatureResult.lineMatchStartsOn, signatureResult.accessor);
                selectedFileDocumentContent = csharp.addMemberToDocument(subcommand, methodBodySignature, eol, selectedFileDocumentContent, false);

              }
              else
              {
                const body = getMemberBodyByBrackets(editor, signatureResult);
                const methodBodySignature = new SignatureLineResult(body, signatureResult.signatureType, signatureResult.lineMatchStartsOn, signatureResult.accessor);
                selectedFileDocumentContent = csharp.addMemberToDocument(subcommand, methodBodySignature, eol, selectedFileDocumentContent, false);
              }
            }
          }
          else
          {
            if (signatureResult.accessor === 'protected')
            {
              vscode.window.showErrorMessage(`Unsupported pull. Protected members can not be pulled to an inteface. Please copy method manually`);
              return;
            }
            selectedFileDocumentContent = csharp.addMemberToDocument(subcommand, signatureResult, eol, selectedFileDocumentContent, true);
          }

          if (selectedFileDocumentContent)
          {
            const currentDocumentUsings = getUsingStatements(editor);
            selectedFileDocumentContent = csharp.addUsingsToDocument(eol, selectedFileDocumentContent, currentDocumentUsings);
            selectedFileDocumentContent = cleanExcessiveNewLines(selectedFileDocumentContent);
            selectedFileDocumentContent = selectedFileDocumentContent.replace('namespace', `${eol}namespace`);
            const success = await csharp.applyEditsAsync(files[0].path, selectedFileDocumentContent);
            if (!success)
            {
              vscode.window.showErrorMessage(`Unable to update ${subcommand}. Please copy manually`);
              return;
            }

            const wasSaved = await selectedFileDocument.save();
            if (!wasSaved)
            {
              vscode.window.showWarningMessage(`Unable to save updates to ${subcommand}. Please save file manually`);
              return;
            }
            const memberName = getMemberName(signatureResult!.signature);
            vscode.window.showInformationMessage(`${memberName} pulled to ${subcommand}`);
          }
          else
          {
            vscode.window.showErrorMessage(`Unable to parse file ${subcommand}. Please copy manually`);
          }

        }
      });

      context.subscriptions.push(disposable);
    }
  });

  // const cacheSubCommand = 'Missing File? Clear Cache';
  // const cacheCommand = `${extensionName}.${cacheSubCommand}`;
  // const isCacheCommandRegistered = await isSubcommandRegisteredAsync(cacheCommand);
  // if (!isCacheCommandRegistered)
  // {
  //   const cacheDisposable = vscode.commands.registerTextEditorCommand(cacheCommand, async (editor) =>
  //   {
  //     allCommands = null;
  //   });
  //   context.subscriptions.push(cacheDisposable);
  //   subcommands.push(cacheSubCommand);
  // }

  // Show a quick pick to execute subcommands
  const chosenSubcommand = await vscode.window.showQuickPick(subcommands);

  // Execute the chosen subcommand
  if (chosenSubcommand)
  {
    vscode.commands.executeCommand(`${extensionName}.${chosenSubcommand}`);
  }
};

// This method is called when your extension is deactivated
export function deactivate()
{ }
