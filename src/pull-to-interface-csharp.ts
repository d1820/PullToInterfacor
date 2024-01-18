import { Range, TextEditor, Uri, WorkspaceEdit, workspace } from "vscode";
import { IWindow } from "./interfaces/window.interface";
import { getClassName, getInheritedNames, getNamespace, getMethodSignatureText, getPropertySignatureText, SignatureType, SignatureLineResult, getUsingStatementsFromText, replaceUsingStatementsFromText, getBeginningOfLineIndent } from "./utils/csharp-util";
import { isTextEditorOpen, isTextInEditor, isWorkspaceLoaded } from "./utils/workspace-util";

export const getSubCommandsAsync = async (workspaceRoot: string, window: IWindow): Promise<string[]> => {
  if (!isWorkspaceLoaded(workspaceRoot, window)) { return []; };
  if (!isTextEditorOpen(window)) { return []; };

  const editor = window.activeTextEditor;
  const text = editor.document.getText();
  if (!isTextInEditor(text, window)) { return []; };

  const namespace = getNamespace(text, window);
  if (!namespace) { return []; };
  const className = getClassName(text, window);
  if (!className) { return []; };

  let inheritedNames = getInheritedNames(text, true);

  inheritedNames = await lookForSubInheritedNamesAsync(inheritedNames);
  const cleanedNames = inheritedNames.filter(f => f.startsWith('I')); //Filter base classes for now
  return [...new Set(cleanedNames)];
};

const lookForSubInheritedNamesAsync = async (inheritedNames: string[]): Promise<string[]> => {
  for (const fileName of inheritedNames) {
    const files = await workspace.findFiles(`**/${fileName}.cs`, '**/node_modules/**');
    const document = await workspace.openTextDocument(files[0].path);
    const text = document.getText();
    const subInheritedNames = getInheritedNames(text, true);
    if (subInheritedNames.length > 0) {
      inheritedNames = [...inheritedNames, ...subInheritedNames, ...(await lookForSubInheritedNamesAsync(subInheritedNames))];
    }
  };
  return inheritedNames;
}

export const getSignatureToPull = (editor: TextEditor): SignatureLineResult | null => {
  const propertySignature = getPropertySignatureText(editor);

  const methodSignature = getMethodSignatureText(editor);

  if (propertySignature?.signature) {
    if (propertySignature.signatureType === SignatureType.FullProperty) {
      return { signature: `${propertySignature.signature} { get; set; }`, signatureType: propertySignature.signatureType };
    }
    return { signature: `${propertySignature.signature} { get; }`, signatureType: propertySignature.signatureType };
  }

  if (methodSignature?.signature) {
    if (methodSignature.signatureType === SignatureType.Method) {
      return { signature: `${methodSignature.signature};`, signatureType: methodSignature.signatureType };
    }
  }
  return null;
};

export const applyEditsAsync = async (filePath: string, newFileContent: string): Promise<boolean> => {
  const edit = new WorkspaceEdit();
  const uri = Uri.file(filePath);

  // Replace a specific range of lines with new content
  edit.replace(uri, new Range(0, 0, Number.MAX_VALUE, 0), newFileContent);

  // Apply the edit
  return await workspace.applyEdit(edit);
};

export const getEditorDefaultIndent = (): number => {
  const editorConfig = workspace.getConfiguration('editor');
  return editorConfig.get<number>('tabSize', 4); // Default to 4 spaces
};

export const addMemberToInterface = (subcommand: string,
  signatureResult: SignatureLineResult,
  eol: string,
  interfaceFileContent: string): string => {

  if (!signatureResult.signature) {
    return interfaceFileContent;
  }
  const interfaceRegEx = new RegExp(`(.*public\\s*interface\\s*${subcommand}[\\s]*{)`);
  const interfaceMatchedMember = interfaceFileContent!.match(interfaceRegEx);

  if (interfaceMatchedMember) {
    const originalText = interfaceMatchedMember[1]; //group from regex
    //get the indent count
    const beginningIndent = getBeginningOfLineIndent(originalText);
    let totalLength = signatureResult.signature.length;
    const indent = getEditorDefaultIndent();
    totalLength = totalLength + beginningIndent + indent;
    const newText = `${originalText}${eol}${signatureResult.signature.padStart(totalLength, ' ')}${eol}`;
    interfaceFileContent = interfaceFileContent!.replace(interfaceRegEx, newText);
    return interfaceFileContent;
  } else {
    return interfaceFileContent;
  }
}

export const addUsingsToInterface = (
  eol: string,
  interfaceFileContent: string,
  usings: string[]): string => {

  if (!interfaceFileContent) {
    return interfaceFileContent;
  }
  //add the usings to file content
  const existingInterfaceUsings = getUsingStatementsFromText(interfaceFileContent);
  let combinedUsings = [...usings, ...existingInterfaceUsings];
  combinedUsings = [...new Set(combinedUsings)]; //distinct
  interfaceFileContent = replaceUsingStatementsFromText(interfaceFileContent, combinedUsings, eol);
  return interfaceFileContent;
}
