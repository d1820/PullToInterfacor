using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SampleProject;

namespace Sample
{
    public class BaseClass : IBaseClass
    {
        public string FullPropertyAlt
        {
            get
            {
                return _fullProperty;
            }
            set
            {
                _fullProperty = value;
            }
        }
        public int MyProperty { get; set; }
    }
}
