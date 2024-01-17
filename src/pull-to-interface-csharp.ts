import { Range, TextEditor, Uri, WorkspaceEdit, workspace } from "vscode";
import { IWindow } from "./interfaces/window.interface";
import { getClassName, getInheritedNames, getNamespace, getMethodSignatureText, getPropertySignatureText, SignatureType, SignatureLineResult } from "./utils/csharp-util";
import { isTextEditorOpen, isTextInEditor, isWorkspaceLoaded } from "./utils/workspace-util";

export const getSubCommands = (workspaceRoot: string, window: IWindow): string[] => {
  if (!isWorkspaceLoaded(workspaceRoot, window)) { return []; };
  if (!isTextEditorOpen(window)) { return []; };

  const editor = window.activeTextEditor;
  const text = editor.document.getText();
  if (!isTextInEditor(text, window)) { return []; };

  const namespace = getNamespace(text, window);
  if (!namespace) { return []; };
  const className = getClassName(text, window);
  if (!className) { return []; };

  const inheritedNames = getInheritedNames(text, false, window);
  return inheritedNames;
};

export const getSignatureToPull = (editor: TextEditor): SignatureLineResult | null => {
  const propertySignature = getPropertySignatureText(editor);

  const methodSignature = getMethodSignatureText(editor);

  if (propertySignature?.signature) {
    if (propertySignature.signatureType === SignatureType.FullProperty) {
      return { signature: `${propertySignature.signature} {get;set;}`, signatureType: propertySignature.signatureType };
    }
    return { signature: `${propertySignature.signature} {get;}`, signatureType: propertySignature.signatureType };
  }

  if (methodSignature?.signature) {
    if (methodSignature.signatureType === SignatureType.Method) {
      return { signature: `${methodSignature.signature};`, signatureType: methodSignature.signatureType };
    }
  }
  return null;
};

export const readContents = async (filePath: string): Promise<string | undefined> => {
  try {
    const document = await workspace.openTextDocument(filePath);
    const text = document.getText();
    return text;
  } catch (error) {
    console.error(`Error reading file contents: ${error}`);
    return undefined;
  }
};

export const replaceFileContent = async (filePath: string, newFileContent: string): Promise<boolean> => {
  const edit = new WorkspaceEdit();
  const uri = Uri.file(filePath);

  // Replace a specific range of lines with new content
  edit.replace(uri, new Range(0, 0, Number.MAX_VALUE, 0), newFileContent);

  // Apply the edit
  return await workspace.applyEdit(edit);
};

export const getIndent = (): number => {
  const editorConfig = workspace.getConfiguration('editor');
  return editorConfig.get<number>('tabSize', 4); // Default to 4 spaces
};

export const addMemberToInterface = (subcommand: string, signatureResult: SignatureLineResult, eol: string, interfaceFileContent: string | undefined): string | null => {
  if (!signatureResult.signature) {
    return null;
  }
  const interfaceRegEx = new RegExp(`(.*public\\s*interface\\s*${subcommand}[\\s]*{)`);
  const interfaceMatchedMember = interfaceFileContent!.match(interfaceRegEx);

  if (interfaceMatchedMember) {
    const originalText = interfaceMatchedMember[1]; //group from regex
    //get the indent count
    const spaceCountRegex = /^[\r\n]*(\s*)/;
    const count = originalText.match(spaceCountRegex);
    let totalLength = signatureResult.signature.length;
    const indent = getIndent();
    if (count && count.length > 1) {
      totalLength = totalLength + count[1].length + indent;
    }
    const newText = `${originalText}${eol}${signatureResult.signature.padStart(totalLength, ' ')}${eol}`;
    interfaceFileContent = interfaceFileContent!.replace(interfaceRegEx, newText);
    return interfaceFileContent;
  } else {
    return null;
  }
}


