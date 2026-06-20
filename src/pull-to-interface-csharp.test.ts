import { baseClassFile, expectedInterfaceFile, interfaceFile } from './test/test-class';
import { addMemberToDocument, addUsingsToDocument, getSignatureToPull, getSignatureText } from './pull-to-interface-csharp';
import { SignatureLineResult, SignatureType } from './utils/csharp-util';
import * as vscodeMock from 'jest-mock-vscode';
import { MockTextEditor } from 'jest-mock-vscode/dist/vscode';
import { testFile } from './test/test-class';
import { Position, Selection, Uri } from 'vscode';

const TEST_ACCESSOR: string = 'public';

describe('Pull To Interface CSharp', () =>
{
  describe('addMemberToInterface', () =>
  {
    it('should return interface file with property included', () =>
    {

      const expected = expectedInterfaceFile;
      // Act
      const output = addMemberToDocument('IMyClass', new SignatureLineResult('int MyProperty { get; set; }', SignatureType.FullProperty, 1, 'public'), '\n', interfaceFile, true);

      expect(expected).toEqual(output);
    });

    it('should return base class file with protected method included', () =>
    {
      const signature = `
      protected Task<int> GetProtected<TNewType>(string name,
                                                  string address) where TNewType : TType
      {
          Console.WriteLine("protected");
          var coll = new List<string>();
      }`;
      // Act
      const output = addMemberToDocument('BaseClass', new SignatureLineResult(signature, SignatureType.FullProperty, 1, 'protected'), '\n', baseClassFile, false);

      expect(output).toContain('Console.WriteLine("protected");');
      expect(output).toContain('protected Task<int> GetProtected<TNewType>(string name,');
      expect(output).toContain('var coll = new List<string>();');
    });

  });
  describe('getMethodSignatureText', () =>
  {
    it('should return current method line when cursor is positioned in the member body', () =>
    {
      // Act
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), testFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(37, 0)));

      const result = getSignatureText(editor, TEST_ACCESSOR);

      // Assert
      expect(result?.signature).toEqual('Task<int> GetNewIdAsync<TNewType>(string name,string address,string city,string state) where TNewType : TType');
      expect(result?.signatureType).toEqual(SignatureType.Method);
    });

    it('should return null when when cursor is positioned in property', () =>
    {
      // Act
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), testFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(21, 0)));

      const result = getSignatureText(editor, TEST_ACCESSOR);

      // Assert
      expect(result?.signatureType).not.toEqual(SignatureType.Method);
    });

    it('should return null  when cursor is positioned in full lambda property', () =>
    {
      // Act
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), testFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(14, 0)));

      const result = getSignatureText(editor, TEST_ACCESSOR);

      // Assert
      expect(result?.signatureType).not.toEqual(SignatureType.Method);
    });

  });

  describe('addMemberToDocument edge cases', () =>
  {
    it('should return document unchanged when signature is null', () =>
    {
      const output = addMemberToDocument('IMyClass', new SignatureLineResult(null, SignatureType.FullProperty, 1, 'public'), '\n', interfaceFile, true);
      expect(output).toEqual(interfaceFile);
    });

    it('should return document unchanged when subcommand has no match', () =>
    {
      const output = addMemberToDocument('IFakeClass', new SignatureLineResult('int Foo { get; set; }', SignatureType.FullProperty, 1, 'public'), '\n', interfaceFile, true);
      expect(output).toEqual(interfaceFile);
    });
  });

  describe('addUsingsToDocument', () =>
  {
    it('should merge new usings into existing document', () =>
    {
      const result = addUsingsToDocument('\n', interfaceFile, ['using System.Net;']);
      expect(result).toContain('using System.Net;');
      expect(result).toContain('using System;');
    });

    it('should deduplicate usings', () =>
    {
      const result = addUsingsToDocument('\n', interfaceFile, ['using System;']);
      const count = (result.match(/using System;/g) || []).length;
      expect(count).toBe(1);
    });

    it('should return empty string when documentFileContent is empty', () =>
    {
      const result = addUsingsToDocument('\n', '', ['using System;']);
      expect(result).toEqual('');
    });
  });

  describe('known bugs - wrong output', () =>
  {
    it('BUG: async method pulled to interface keeps async keyword', () =>
    {
      const asyncFile = `using System.Threading.Tasks;\nnamespace Sample\n{\n    public class MyClass : IMyClass\n    {\n        public async Task<int> GetAsync()\n        {\n            return await Task.FromResult(1);\n        }\n    }\n}`;
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), asyncFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(7, 0)));

      const result = getSignatureToPull(editor, TEST_ACCESSOR);

      expect(result?.signature).not.toContain('async');
    });

    it('BUG: readonly property gets { get; set; } instead of { get; }', () =>
    {
      const readOnlyFile = `namespace Sample\n{\n    public class MyClass : IMyClass\n    {\n        public int ReadOnlyProp { get; }\n    }\n}`;
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), readOnlyFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(4, 0)));

      const result = getSignatureToPull(editor, TEST_ACCESSOR);

      expect(result?.signature).toContain('{ get; }');
      expect(result?.signature).not.toContain('{ get; set; }');
    });

    it('BUG: addMemberToDocument base class regex matches partial class name', () =>
    {
      const fileWithBaseClass = `namespace Sample\n{\n    public class BaseClass : IBaseClass\n    {\n    }\n}`;
      const result = addMemberToDocument('Base', new SignatureLineResult('int Foo { get; set; }', SignatureType.FullProperty, 1, 'public'), '\n', fileWithBaseClass, false);

      expect(result).toEqual(fileWithBaseClass);
    });

    it('BUG: base class insertion has no indentation', () =>
    {
      const sig = 'public void Foo() { }';
      const result = addMemberToDocument('BaseClass', new SignatureLineResult(sig, SignatureType.Method, 1, 'public'), '\n', baseClassFile, false);
      const insertedLine = result.split('\n').find(l => l.includes('Foo'));

      expect(insertedLine).toMatch(/^\s+/);
    });
  });

  describe('getSignatureToPull', () =>
  {
    it('should return null when editor is null', () =>
    {
      const result = getSignatureToPull(null as any, 'public');
      expect(result).toBeNull();
    });

    it('should return method signature with semicolon', () =>
    {
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), testFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(37, 0)));

      const result = getSignatureToPull(editor, TEST_ACCESSOR);

      expect(result?.signature).toContain(';');
      expect(result?.signatureType).toEqual(SignatureType.Method);
    });

    it('should return full property with get set', () =>
    {
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), testFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(10, 0)));

      const result = getSignatureToPull(editor, TEST_ACCESSOR);

      expect(result?.signature).toContain('{ get; set; }');
      expect(result?.signatureType).toEqual(SignatureType.FullProperty);
    });

    it('should return lambda property with get only', () =>
    {
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), testFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(11, 0)));

      const result = getSignatureToPull(editor, TEST_ACCESSOR);

      expect(result?.signature).toContain('{ get; }');
      expect(result?.signatureType).toEqual(SignatureType.LambaProperty);
    });
  });

  describe('getSignatureText edge cases', () =>
  {
    it('should return null when cursor is at line 0 and no accessor found', () =>
    {
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), testFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(0, 0), new Position(0, 0)));

      const result = getSignatureText(editor, TEST_ACCESSOR);

      expect(result).toBeNull();
    });
  });

  describe('getPropertySignatureText', () =>
  {
    it('should return SignatureType.Method when cursor is positioned in the method body', () =>
    {
      // Act
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), testFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(37, 0)));

      const result = getSignatureText(editor, TEST_ACCESSOR);

      // Assert
      expect(result?.signatureType).toEqual(SignatureType.Method);
    });

    it('should return current full property line when when cursor is positioned in property', () =>
    {
      // Act
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), testFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(21, 0)));

      const result = getSignatureText(editor, TEST_ACCESSOR);

      // Assert
      expect(result?.signature).toEqual('string FullPropertyAlt');
      expect(result?.signatureType).toEqual(SignatureType.FullProperty);
    });

    it('should return current auto property line when when cursor is positioned in property', () =>
    {
      // Act
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), testFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(10, 0)));

      const result = getSignatureText(editor, TEST_ACCESSOR);

      // Assert
      expect(result?.signature).toEqual('int MyProperty');
      expect(result?.signatureType).toEqual(SignatureType.FullProperty);
    });

    it('should return current lamda read only property line when when cursor is positioned in property', () =>
    {
      // Act
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), testFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(11, 0)));

      const result = getSignatureText(editor, TEST_ACCESSOR);

      // Assert
      expect(result?.signature).toEqual('int MyPropertyLamda');
      expect(result?.signatureType).toEqual(SignatureType.LambaProperty);
    });

    it('should return current full lambda property line  when cursor is positioned in full lambda property', () =>
    {
      // Act
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), testFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(14, 0)));

      const result = getSignatureText(editor, TEST_ACCESSOR);

      // Assert
      expect(result?.signature).toEqual('string FullProperty');
      expect(result?.signatureType).toEqual(SignatureType.FullProperty);
    });

  });

});


