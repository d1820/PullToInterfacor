import { TextEditor } from 'vscode';
import { IWindow } from '../interfaces/window.interface';
import { match } from 'assert';

/**
 * Extracts the namespace of the model.
 *
 * @param text The model text
 */
export const getNamespace = (text: string, window: IWindow): string | null => {
  // Search for words after "namespace".
  const namespace = text.match(/(?<=\bnamespace\s)(.+)/);
  if (!namespace) {
    window.showErrorMessage('Could not find the namespace.');
    return null;
  }
  return namespace[0];
};

export const getClassName = (text: string, window: IWindow): string | null => {
  // Strip out `abstract ` modifier
  text = text.replace(/abstract /g, '');
  // Search for the first word after "public class" to find the name of the model.
  const classNames = text.match(/(?<=\bpublic class\s)(\w+)/);
  if (!classNames) {
    window.showErrorMessage('Could not find the class name.');
    return null;
  }
  return classNames[0];
};

export const getInheritedNames = (text: string, window: IWindow): string[] => {
  // Search for the first word after "public class" to find the name of the model.
  const inheritedNames = text.match(/:(.*?)(?:\bwhere\b|$)/);
  if (!inheritedNames || inheritedNames.length === 0) {
    window.showErrorMessage('Could not find the any inherited members.');
    return [];
  }
  const names = inheritedNames[1].split(',');
  const cleanedNames = names.map(n => n.replace(/\s/g, ''));
  return cleanedNames;
};

export const getCurrentLine = (editor: TextEditor): string | null => {
  if (editor) {
    // Get the position of the cursor
    const cursorPosition = editor.selection.active;

    // Get the line of text where the cursor is currently positioned
    const currentLine = editor.document.lineAt(cursorPosition.line).text;
    return currentLine;
  }
  return null;
};

export const getPropertySignatureText = (editor: TextEditor): string | null => {
  let signature: string | null = null;
  if (editor) {
    // Get the position of the cursor
    const cursorPosition = editor.selection.active;
    let line = cursorPosition.line;
    let publicMatch = isPublicLine(editor, line);
    if (publicMatch) {
      signature = getPublicPropertyLine(editor, line);
    } else {
      while (!publicMatch && !isEmptyLine(editor, line)) {
        if (line < 1) {
          break;
        }
        line = line - 1;
        publicMatch = isPublicLine(editor, line);
        if (publicMatch) {
          signature = getPublicPropertyLine(editor, line);
          break;
        }
      }
    }
    if (signature) {
      signature = signature.replace(/public|\s{2,}[\r\n]*/gm, '').trim();
    }
  }

  return isMethod(signature) ?  signature : null;
};

export const getMethodSignatureText = (editor: TextEditor): string | null => {
  let signature: string | null = null;
  if (editor) {
    // Get the position of the cursor
    const cursorPosition = editor.selection.active;
    let line = cursorPosition.line;
    let publicMatch = isPublicLine(editor, line);
    if (publicMatch) {
      signature = getPublicMethodLine(editor, line);
    } else {
      while (!publicMatch && !isEmptyLine(editor, line)) {
        if (line < 1) {
          break;
        }
        line = line - 1;
        publicMatch = isPublicLine(editor, line);
        if (publicMatch) {
          signature = getPublicMethodLine(editor, line);
          break;
        }
      }
    }
    if (signature) {
      signature = signature.replace(/public|\s{2,}[\r\n]*/gm, '').trim();
    }
  }

  return isMethod(signature) ?  signature : null;
};

const isMethod = (signature: string | null): boolean => {
  if (!signature) {
    return false;
  }
  const match = signature.match(/\([^)]*\)/);
  if (match) {
    return true;
  }
  return false;
};

const getPublicPropertyLine = (editor: TextEditor, startingLine: number): string | null => {
  let sig: string | null = null;
  let lines: string = '';
  while (lines.indexOf('{') === -1) {
    lines = lines + editor.document.lineAt(startingLine).text;
    startingLine++;
  }
  const regex = /(public[\s\S]*?)\{/;
  const signatureMatch = lines.match(regex);
  if (signatureMatch) {
    sig = signatureMatch[1];
  }
  return sig;
};

const getFullProperty = (line: string) => {
  const regex = /public\s+\w+\s+[\w+\s*]*\{[\W\s]*get[\W\s]*\{[\W\s]*.*[\W\s]*\}[\W\s]*set[\W\s]*\{[\W\s]*.*[\W\s]*\}[\W\s]*/;
}

const getExplicitSetProperty = () => {
  const regex = /public\s+\w+\s+\w+\s*\{\s*get\s*=>[^}]*\s*set\s*=>[^}]*\s*\}/;
}

const getAutoProperty = () => {
  const regex = /public\s+\w+\s+\w+\s*\{\s*get;\s*set;\s*\}/;
}

const getReadOnlyAutoProperty = () => {
  const regex = /public\s+\w+\s+\w+\s*=>\s*((?:\w+;\s*)|\s*\w+\s*\{\s*.*?\}\s*)/;
}

const getPublicMethodLine = (editor: TextEditor, startingLine: number): string | null => {
  let sig: string | null = null;
  let lines: string = '';
  while (lines.indexOf('{') === -1) {
    lines = lines + editor.document.lineAt(startingLine).text;
    startingLine++;
  }
  const regex = /(public[\s\S]*?)\{/;
  const signatureMatch = lines.match(regex);
  if (signatureMatch) {
    sig = signatureMatch[1];
  }
  return sig;
};

const isPublicLine = (editor: TextEditor, line: number): boolean => {
  let currentLine = editor.document.lineAt(line).text;
  const publicMatch = currentLine.match(/public\s/);
  if (publicMatch) {
    return true;
  }
  return false;
};

const isEmptyLine = (editor: TextEditor, line: number): boolean => {
  let currentLine = editor.document.lineAt(line).text;
  const match = currentLine.match(/\n|\r|\}|private|protected|internal|^$/);
  if (match) {
    return true;
  }
  return false;
};
