import { EndOfLine, TextEditor } from 'vscode';
import { IWindow } from '../interfaces/window.interface';

export type PublicProtected = 'public' | 'protected';

export enum SignatureType
{
  FullProperty,
  LambaProperty,
  Method,
  Unknown
}

export class SignatureLineResult
{
  signature: string | null;
  signatureType: SignatureType;
  lineMatchStartsOn: number;
  accessor: PublicProtected;
  originalSelectedLine: string;

  constructor(signature: string | null, signatureType: SignatureType, lineMatchStartsOn: number, accessor: PublicProtected)
  {
    this.signature = signature;
    this.signatureType = signatureType;
    this.lineMatchStartsOn = lineMatchStartsOn;
    this.accessor = accessor;
  }

  public static createFromSignatureLineResult(signature: string, signatureResult: SignatureLineResult)
  {
    var sig = new SignatureLineResult(signature, signatureResult.signatureType, signatureResult.lineMatchStartsOn, signatureResult.accessor);
    sig.originalSelectedLine = signatureResult.originalSelectedLine;
    return sig;
  }
}

export const getNamespace = (text: string, window: IWindow): string | null =>
{
  // Search for words after "namespace".
  const namespace = text.match(/(?<=\bnamespace\s)(.+)/);
  if (!namespace)
  {
    window.showErrorMessage('Could not find the namespace.');
    return null;
  }
  return namespace[0];
};

export const getClassName = (text: string, window: IWindow): string | null =>
{
  // Strip out `abstract ` modifier
  text = text.replace(/abstract /g, '');
  // Search for the first word after "public class" to find the name of the model.
  const classNames = text.match(/(?<=\bpublic class\s)(\w+)/);
  if (!classNames)
  {
    window.showErrorMessage('Could not find the class name.');
    return null;
  }
  return classNames[0];
};

export const getMemberName = (text: string): string | undefined =>
{
  const memberRegEx = new RegExp('\\w*.*(?=[\\{\\(])', 'gm');
  // Search for the first word after "public class" to find the name of the model.
  const memberNameMatches = text.match(memberRegEx);
  if (!memberNameMatches)
  {
    return undefined;
  }
  const name = memberNameMatches[0].trim().split(' ').pop();
  return name;
};

export const getInheritedNames = (text: string, includeBaseClasses: boolean): string[] =>
{
  // Search for the first word after "public class" to find the name of the model.
  // ex) public class MyClass<TType> : BaseClass, IMyClass, IMyTypedClass<string> where TType : class
  // matches BaseClass, IMyClass, IMyTypedClass<string>
  const rr = new RegExp(':(.*?)(?:\\bwhere\\b|\\{|$)', 'gm');
  const inheritedNames = rr.exec(text);
  if (!inheritedNames || inheritedNames.length <= 1)
  {
    return [];
  }
  const names = inheritedNames[1].split(',');
  // matches any spaces or generic types <TType>
  let cleanedNames = names.map(n => n.replace(/\s|\<.*\>/g, ''));
  if (!includeBaseClasses)
  {
    cleanedNames = cleanedNames.filter(f => f.startsWith('I'));
  }
  return cleanedNames;
};

export const getCurrentLine = (editor: TextEditor): string | null =>
{
  if (editor)
  {
    // Get the position of the cursor
    const cursorPosition = editor.selection.active;

    // Get the line of text where the cursor is currently positioned
    const currentLine = editor.document.lineAt(cursorPosition.line).text;
    return currentLine.trim();
  }
  return null;
};

export const cleanString = (str: string | null): string | null =>
{
  if (!str)
  {
    return str;
  }
  const regex = /\s{2,}[\r\n]*/gm;
  return str.replace(regex, '').trim();
};

export const cleanAccessor = (accessor: string, str: string | null): string | null =>
{
  if (!str)
  {
    return str;
  }
  const regex = new RegExp(`${accessor}`, 'gm');
  return str.replace(regex, '').trim();
};

export const isMethod = (signature: string | null | undefined): boolean =>
{
  if (!signature)
  {
    return false;
  }
  const match = signature.match(/\([^)]*\)/);
  if (match)
  {
    return true;
  }
  return false;
};

const getFullBracketProperty = (line: string) =>
{
  const regex = /public\s+\w+\s+[\w+\s*]*\{[\W\s]*get[\W\s]*\{[\W\s]*.*[\W\s]*\}[\W\s]*set[\W\s]*\{[\W\s]*.*[\W\s]*\}[\W\s]*/;
};

const getFullLambdaProperty = () =>
{
  const regex = /public\s+\w+\s+\w+\s*\{\s*get\s*=>[^}]*\s*set\s*=>[^}]*\s*\}/;
};

const getAutoProperty = () =>
{
  const regex = /public\s+\w+\s+\w+\s*\{\s*get;\s*set;\s*\}/;
};

const getReadOnlyAutoProperty = () =>
{
  const regex = /public\s+\w+\s+\w+\s*=>\s*((?:\w+;\s*)|\s*\w+\s*\{\s*.*?\}\s*)/;
};

export const getMemberBodyByBrackets = (editor: TextEditor, signatureResult: SignatureLineResult) =>
{
  let currentLine;
  let bracketCount: number = 0;
  let startingLine = signatureResult.lineMatchStartsOn;
  let loop = true;
  let startTrackingBracketCounts = false;
  let bodyLines = [];
  while (loop)
  {
    currentLine = editor.document.lineAt(startingLine).text;
    if (currentLine.indexOf("{") > -1)
    {
      bracketCount++;
      startTrackingBracketCounts = true; // we hit first bracket
    }
    if (currentLine.indexOf("}") > -1)
    {
      bracketCount--;
    }
    if (isTerminating(currentLine, false, signatureResult.signatureType !== SignatureType.Method) && bracketCount === 0) // this means there are empty lines in the method
    {
      loop = false;
    }
    if (startTrackingBracketCounts && bracketCount === 0)
    {
      loop = false;
    }
    bodyLines.push(currentLine);
    startingLine++;
  }
  if (bracketCount !== 0)
  {
    return null;
  }
  const body = bodyLines.join(getLineEnding(editor));
  return body;
};

export const getMemberBodyBySemiColon = (editor: TextEditor, signatureResult: SignatureLineResult) =>
{
  let currentLine;
  let semiColonCount: number = 0;
  let startingLine = signatureResult.lineMatchStartsOn;
  let loop = true;
  let bodyLines = [];
  while (loop)
  {
    currentLine = editor.document.lineAt(startingLine).text;
    if (currentLine.indexOf(";") > -1)
    {
      semiColonCount++;
      loop = false;
    }
    if (isTerminating(currentLine, false)) // this means there are empty lines in the method
    {
      loop = false;
    }
    bodyLines.push(currentLine);
    startingLine++;
  }
  if (semiColonCount !== 1)
  {
    return null;
  }
  const body = bodyLines.join(getLineEnding(editor));
  return body;
};

//This gets the signature based on the cursor being on the top method or property line, not in the body of the member
export const getFullSignatureOfLine = (accessor: string, editor: TextEditor, startingLine: number): SignatureLineResult | null =>
{
  const documentStartingLine = startingLine;

  let sig: string | null = null;
  let lines: string | null = '';
  while (lines.indexOf('{') === -1 && lines.indexOf(';') === -1)
  {
    lines = lines + editor.document.lineAt(startingLine).text;
    startingLine++;
  }
  lines = cleanString(lines);
  const regex = new RegExp(`(${accessor}[\\s\\S]*?)({|\\=\\>)`);
  const signatureMatch = lines ? regex.exec(lines) : null;
  if (signatureMatch)
  {
    sig = signatureMatch[1];
  }
  let sigType = SignatureType.Unknown;
  if (lines)
  {
    if (lines.indexOf('(') > -1)
    {
      sigType = SignatureType.Method;
    }
    else if (lines.indexOf('{') > -1)
    {
      sigType = SignatureType.FullProperty; //this is an assumption
    }
    else if (lines.indexOf('=>') > -1)
    {
      sigType = SignatureType.LambaProperty;
    }
  }
  const cleaned = cleanString(sig);
  if (!cleaned)
  {
    sigType = SignatureType.Unknown;
  }
  let acc: PublicProtected = 'public';
  if (cleaned?.startsWith('protected'))
  {
    acc = 'protected';
  }
  return new SignatureLineResult(cleaned, sigType, documentStartingLine, acc);
};

export const isValidAccessorLine = (currentLine: string, accessor: string): boolean =>
{
  const regEx = new RegExp(`${accessor}\\s`);
  const publicMatch = currentLine.match(regEx);
  if (publicMatch)
  {
    return true;
  }
  return false;
};

export const isTerminating = (currentLine: string, includeClosingBracket: boolean = true, includeProtected: boolean = true): boolean =>
{
  let match;
  let bracket = includeClosingBracket ? '|\\}' : '';
  let protectedStr = includeProtected ? '|protected' : '';
  let regex = new RegExp(`\\n|\\r${bracket}|private${protectedStr}|internal|^$`, 'gm');
  match = currentLine.match(regex);

  if (match)
  {
    return true;
  }
  return false;
};

export const getLineEnding = (editor: TextEditor): string =>
{
  const document = editor.document;
  if (EndOfLine.CRLF === document.eol)
  {
    return '\r\n';
  }
  return '\n';
};

export const getUsingStatements = (editor: TextEditor): string[] =>
{
  const document = editor.document;
  const docText = document.getText();
  return getUsingStatementsFromText(docText);
};

export const getUsingStatementsFromText = (docText: string): string[] =>
{
  const usingRegex = new RegExp('using.*;[\r\n*]', 'gm');
  const matches = docText.match(usingRegex);
  return matches?.map(m => m) || [];
};

export const replaceUsingStatementsFromText = (docText: string, newUsings: string[], eol: string): string =>
{
  const usingRegex = new RegExp('^using.*;[\r\n*]', 'gm');
  const u = newUsings.join('');
  let cleared = docText.replace(usingRegex, '');
  cleared = u + eol + cleared;
  return cleared;
};

export const getBeginningOfLineIndent = (text: string): number =>
{
  const spaceCountRegex = /^[\r\n]*(\s*)/;
  const count = text.match(spaceCountRegex);
  if (count && count.length > 1)
  {
    return count[1].length;
  }
  return 0;
};

export const cleanExcessiveNewLines = (text: string, eol: string): string =>
{
  const newlineRegex = /^\s{2,}$/gm;
  text = text.replace(newlineRegex, '');
  return text.replace('namespace', `${eol}namespace`);
};


export const checkIfAlreadyPulledToInterface = (text: string, signatureResult: SignatureLineResult, eol: string): boolean =>
{
  const testValue = cleanAllAccessors(signatureResult.originalSelectedLine).trim();
  // if (signatureResult.signatureType === SignatureType.Method)
  // {
  //   return text.indexOf(testValue + eol) > -1;
  // }
  return text.indexOf(testValue) > -1;
};

export const cleanAllAccessors = (text: string): string =>
{
  let regex = new RegExp(`((public|private|protected|internal|abstract|virtual|override)[\\s]*)`, 'gm');
  return text.replace(regex,'');
};
