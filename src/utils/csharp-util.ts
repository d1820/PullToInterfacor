import { TextEditor } from 'vscode';
import { IWindow } from '../interfaces/window.interface';

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
  // ex) public class MyClass<TType> : BaseClass, IMyClass, IMyTypedClass<string> where TType : class
  // matches BaseClass, IMyClass, IMyTypedClass<string>
  const inheritedNames = text.match(/:(.*?)(?:\bwhere\b|$)/);
  if (!inheritedNames || inheritedNames.length === 0) {
    window.showErrorMessage('Could not find any inherited members.');
    return [];
  }
  const names = inheritedNames[1].split(',');
  // matches any spaces or generic types <TType>
  const cleanedNames = names.map(n => n.replace(/\s|\<.*\>/g, ''));
  return cleanedNames;
};

export const getCurrentLine = (editor: TextEditor): string | null => {
  if (editor) {
    // Get the position of the cursor
    const cursorPosition = editor.selection.active;

    // Get the line of text where the cursor is currently positioned
    const currentLine = editor.document.lineAt(cursorPosition.line).text;
    return currentLine.trim();
  }
  return null;
};

export const getPropertySignatureText = (editor: TextEditor): string | null => {
  let signature: string | null = null;
  if (editor) {
    // Get the position of the cursor
    const cursorPosition = editor.selection.active;
    let line = cursorPosition.line;
    let currentLine = editor.document.lineAt(line).text;
    let publicMatch = isPublicLine(currentLine);
    if (publicMatch) {
      signature = getStartOfCodeBlock('public', editor, line);
    } else {
      while (!publicMatch && !isTerminating(currentLine)) {
        if (line < 1) {
          break;
        }
        line = line - 1;
        currentLine = editor.document.lineAt(line).text;
        publicMatch = isPublicLine(currentLine);
        if (publicMatch) {
          signature = getStartOfCodeBlock('public', editor, line);
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
    let currentLine = editor.document.lineAt(line).text;
    let publicMatch = isPublicLine(currentLine);
    if (publicMatch) {
      signature = getStartOfCodeBlock('public', editor, line);
    } else {
      while (!publicMatch && !isTerminating(currentLine)) {
        if (line < 1) {
          break;
        }
        line = line - 1;
        currentLine = editor.document.lineAt(line).text;
        publicMatch = isPublicLine(currentLine);
        if (publicMatch) {
          signature = getStartOfCodeBlock('public', editor, line);
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

export const isMethod = (signature: string | null): boolean => {
  if (!signature) {
    return false;
  }
  const match = signature.match(/\([^)]*\)/);
  if (match) {
    return true;
  }
  return false;
};


const getFullProperty = (line: string) => {
  const regex = /public\s+\w+\s+[\w+\s*]*\{[\W\s]*get[\W\s]*\{[\W\s]*.*[\W\s]*\}[\W\s]*set[\W\s]*\{[\W\s]*.*[\W\s]*\}[\W\s]*/;
};

const getExplicitSetProperty = () => {
  const regex = /public\s+\w+\s+\w+\s*\{\s*get\s*=>[^}]*\s*set\s*=>[^}]*\s*\}/;
};

const getAutoProperty = () => {
  const regex = /public\s+\w+\s+\w+\s*\{\s*get;\s*set;\s*\}/;
};

const getReadOnlyAutoProperty = () => {
  const regex = /public\s+\w+\s+\w+\s*=>\s*((?:\w+;\s*)|\s*\w+\s*\{\s*.*?\}\s*)/;
};

const getMethod = () => {
  //const regex = /public[\s\S]*?\{(?>[^{}]+|(?<open>{)|(?<-open>}))*\}/;
  //Todo: bracket count nd capture
};

const getStartOfCodeBlock = (accessor: string, editor: TextEditor, startingLine: number): string | null => {
  let sig: string | null = null;
  let lines: string = '';
  while (lines.indexOf('{') === -1) {
    lines = lines + editor.document.lineAt(startingLine).text;
    startingLine++;
  }
  const regex = `/(${accessor}[\s\S]*?)\{|(\=\>)`;
  const signatureMatch = lines.match(regex);
  if (signatureMatch) {
    sig = signatureMatch[1];
  }
  return sig;
};

export const isPublicLine = (currentLine: string): boolean => {
  const publicMatch = currentLine.match(/public\s/);
  if (publicMatch) {
    return true;
  }
  return false;
};

export const isTerminating = (currentLine: string): boolean => {
  const match = currentLine.match(/\n|\r|\}|private|protected|internal|^$/);
  if (match) {
    return true;
  }
  return false;
};
