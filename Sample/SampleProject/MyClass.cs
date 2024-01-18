using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Test;


namespace Test
{
    public class TestEntity
    {

    }
}
namespace Sample
{

    public class MyClass<TType> : BaseClass, IMyClass, IMyTypedClass<string>, ITest where TType : class
    {
        private string fullProperty;
        public TestEntity MyProperty { get; set; }
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
        public Task<TestEntity> GetNewIdAsync<TNewType>(string name,
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
