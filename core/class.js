
module.exports.Inherit = function (ClassName, Parent, Child) {
    
   	var Foo = function () { };
   	Foo.prototype = Parent.prototype;
    
   	var foo = new Foo();

   	for (var property in Child.prototype)    		
   		foo[property] = Child.prototype[property];
        
      Child.prototype = foo;
      Child.prototype.index = 0;
      Child.prototype.name = ClassName;
      Child.prototype.super = Parent.prototype;
      Child.default = new Child("default");

   	return Child;
};

module.exports.Construct =  function (object, name) {

	object.className = object.__proto__.name;
	object.__proto__.index++;

	if (name)
		object.name = name;
	else
		object.name += object.__proto__.index;

	return object;
};