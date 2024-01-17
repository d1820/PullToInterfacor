import { expectedInterfaceFile, interfaceFile } from './test/test-class';
import { addMemberToInterface } from './pull-to-interface-csharp';
import { SignatureType } from './utils/csharp-util';


describe('Pull To Interface CSharp', () => {
  describe('addMemberToInterface', () => {
    it('should return the namespace', () => {

      const expected = expectedInterfaceFile;
      // Act
      const output = addMemberToInterface('IMyClass', { signature: 'int MyProperty { get; set; }', signatureType: SignatureType.FullProperty }, '\n', interfaceFile);

      expect(expected).toEqual(output);
    });

  });
});


