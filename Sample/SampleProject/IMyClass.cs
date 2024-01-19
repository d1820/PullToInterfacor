using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SampleProject;

namespace Sample
{
    public interface IMyClass
    {
        async Task<int> GetNewIdAsync<TNewType>(string name,string address,string city,string state) where TNewType : class;
        string FullProperty { get; set; }
    }
}
