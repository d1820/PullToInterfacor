export const testFile = `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Sample
{
    public class MyClass<TType> : BaseClass, IMyClass, IMyTypedClass<string> where TType : class
    {
        private string fullProperty;
        public int MyProperty { get; set; }
        public int MyPropertyLamda => 5;
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

export const testFileBasedNamespace = `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Sample;

public interface IBaseClass
{

}
`;

export const interfaceFile = `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Sample
{
    public interface IMyClass
    {
      string MyOtherItem { get; set; }
    }
}

`

export const expectedInterfaceFile = `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Sample
{
    public interface IMyClass
    {
        int MyProperty { get; set; }

      string MyOtherItem { get; set; }
    }
}

`


