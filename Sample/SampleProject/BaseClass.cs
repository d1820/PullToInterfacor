using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SampleProject;

namespace Sample
{
    public class BaseClass : IBaseClass
    {
        public int MyMethodLamda() => 5;
        public Address MethodLambdaMultiLine() => new Address
        {
            Name = "",
            City = "",
            Street = ""
        };
    }
}
