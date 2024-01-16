import { Position, Selection, TextEditor, Uri } from 'vscode';
import { getClassName, getCurrentLine, getInheritedNames, getNamespace, isMethod, isPublicLine, isTerminating } from './csharp-util';

import * as vscodeMock from 'jest-mock-vscode';
import { MockTextEditor } from 'jest-mock-vscode/dist/vscode';

const testFile = `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Sample
{
    public class MyClass<TType> : BaseClass, IMyClass, IMyTypedClass<string> where TType : class
    {
        private string fullProperty;
        public int MyProperty { get; set; }
        public int MyProperty => 5;
        public string FullProperty
        {
            get => fullProperty;
            set => fullProperty = value;
        }
        public string FullPropertyAlt
        {
            get
            {
                return fullProperty;
            }
            set
            {
                fullProperty = value;
            }
        }
        public Task<int> GetNewIdAsync<TNewType>(string name,
                                                    string address,
                                                    string city,
                                                    string state) where TNewType : TType
        {
            Console.WriteLine("tester");
            var coll = new List<string>();
            if (1 == 1)
            {
                foreach (var item in coll)
                {

                }
            }
        }
    }
}
`;

describe('CSharp Util', () => {

  describe('getNamespace', () => {
    it('should return the namespace', () => {
      // Arrange
      const windowMock = {
        showErrorMessage: jest.fn()
      };
      const text = `namespace Test
    {
    }`;

      // Act
      const name = getNamespace(text, windowMock as any);

      // Assert
      expect(name).toBe('Test');
      expect(windowMock.showErrorMessage).not.toHaveBeenCalled();
    });

    it('should return null and an error message if the namespace in the file is not found', () => {
      // Arrange
      const windowMock = {
        showErrorMessage: jest.fn()
      };
      const text = 'foo bar';

      // Act
      const name = getNamespace(text, windowMock as any);

      // Assert
      expect(name).toBe(null);
      expect(windowMock.showErrorMessage).toHaveBeenCalled();
    });
  });

  describe('getClassName', () => {

    it('should return the name of the class in the file', () => {
      // Arrange
      const windowMock = {
        showErrorMessage: jest.fn()
      };
      const text = `namespace Test
    {
        public class TestModel
        {
            public string StringTest { get; set; }
        }
    }`;

      // Act
      const name = getClassName(text, windowMock as any);

      // Assert
      expect(name).toBe('TestModel');
      expect(windowMock.showErrorMessage).not.toHaveBeenCalled();
    });

    it('should return the name of the class in the file in an abstract class', () => {
      // Arrange
      const windowMock = {
        showErrorMessage: jest.fn()
      };
      const text = `namespace Test
    {
        public abstract class TestModel
        {
            public string StringTest { get; set; }
        }
    }`;

      // Act
      const name = getClassName(text, windowMock as any);

      // Assert
      expect(name).toBe('TestModel');
      expect(windowMock.showErrorMessage).not.toHaveBeenCalled();
    });

    it('should return null and an error message if the model name in the file is not found', () => {
      // Arrange
      const windowMock = {
        showErrorMessage: jest.fn()
      };
      const text = 'foo bar';

      // Act
      const name = getClassName(text, windowMock as any);

      // Assert
      expect(name).toBe(null);
      expect(windowMock.showErrorMessage).toHaveBeenCalled();
    });
  });

  describe('getInheritedNames', () => {
    it('should return the name of the class in the file', () => {
      // Arrange
      const windowMock = {
        showErrorMessage: jest.fn()
      };
      const text = `namespace Test
      {
          public class MyClass<TType> : BaseClass, IMyClass, IMyTypedClass<string> where TType : class
          {
          }
      }`;

      // Act
      const name = getInheritedNames(text, windowMock as any);

      // Assert
      expect(name).toEqual(['BaseClass', 'IMyClass', 'IMyTypedClass']);
      expect(windowMock.showErrorMessage).not.toHaveBeenCalled();
    });

    it('should return [] and an error message if the model name in the file is not found', () => {
      // Arrange
      const windowMock = {
        showErrorMessage: jest.fn()
      };
      const text = 'foo bar';

      // Act
      const name = getInheritedNames(text, windowMock as any);

      // Assert
      expect(name).toEqual([]);
      expect(windowMock.showErrorMessage).toHaveBeenCalled();
    });
  });

  describe('isMethod', () => {
    it('should return false when signature missing', () => {
      // Act
      const result = isMethod(null);

      // Assert
      expect(result).toBeFalsy();
    });

    it('should return true when valid method signature found', () => {
      const text = `public Task<int> GetNewIdAsync<TNewType>(string name,
        string address,
        string city,
        string state) where TNewType : TType
{`;

      // Act
      const result = isMethod(text);

      // Assert
      expect(result).toBeTruthy();
    });
  });

  describe('isPublicLine', () => {
    it('should return false when text does not contain "public"', () => {
      // Act
      const result = isPublicLine("nomatch");

      // Assert
      expect(result).toBeFalsy();
    });

    it('should return true when text contains "public"', () => {
      const text = `public Task<int> GetNewIdAsync<TNewType>()`;

      // Act
      const result = isPublicLine(text);

      // Assert
      expect(result).toBeTruthy();
    });
  });

  describe('isTerminating', () => {
    it('should return false when text does contain "public"', () => {
      // Act
      const result = isTerminating("public Task<int> GetNewIdAsync<TNewType>()");

      // Assert
      expect(result).toBeFalsy();
    });

    it('should return true when text contains "protected"', () => {
      const text = `protected Task<int> GetNewIdAsync<TNewType>()`;

      // Act
      const result = isTerminating(text);

      // Assert
      expect(result).toBeTruthy();
    });

    it('should return true when text contains ""', () => {
      const text = "";

      // Act
      const result = isTerminating(text);

      // Assert
      expect(result).toBeTruthy();
    });

    it('should return true when text contains newline', () => {
      const text = `
      `;

      // Act
      const result = isTerminating(text);

      // Assert
      expect(result).toBeTruthy();
    });
  });


  describe('getCurrentLine', () => {
    it('should return current line where cursor is positioned', () => {
      // Act
      var doc = vscodeMock.createTextDocument(Uri.parse('C:\temp\test.cs'), testFile, 'csharp');
      const editor = new MockTextEditor(jest, doc, undefined, new Selection(new Position(1, 0), new Position(7, 0)));

      const result = getCurrentLine(editor);

      // Assert
      expect(result).toEqual('public class MyClass<TType> : BaseClass, IMyClass, IMyTypedClass<string> where TType : class');
    });

    it('should return null when no editor active', () => {
      const result = getCurrentLine(null as any);

      // Assert
      expect(result).toBeNull();
    });

  });


});


