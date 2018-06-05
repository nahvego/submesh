/*
Este módulo define métodos para comprobar si un objeto cumple con unos requisitos establecidos.

La función toma los siguientes argumentos:
- obj: El objeto en cuestión
- objectType: Indica el tipo de objeto contra el que vamos a comprobar; los valores corresponden a objetos predefinidos.
- required: Controla qué elementos del modelo son obligatorios, posibles valores:
	· Array: Sólo son necesarios los elementos dentro del array.
	· String: Para referirse a una configuración concreta del objeto. Puede lanzar una excepción si no la reconoce.
	· false: (Explícito, no falsish): Ningún elemento es obligatorio.
	· Cualquier otro valor, por defecto: Todos los elementos son obligatorios.

Retorna un objeto con los siguientes campos:
	result: true o false según haya habido errores o no
	errors: Un array de errores, que están formados por objetos con los campos
		field: Nombre del campo con error
		type: Tipo de error
*/

// Validators es un obj que contiene validadores reutilizables
const validators = {
	valid: function() { return true; },
	maxLength: function(max, min) { return this.length <= max && this.length >= (min || 0); },
	username: function() { return !/^[0-9]+$/.test(this) && /^[a-zA-Z0-9_-]{3,15}$/.test(this); },
	description: function() { return validators.maxLength.call(this, 200); },
	avatar: function() { return require('is-image-url')(this, false); },
	email: function() { return require('email-validator').validate(this); },

	subName: function() { return /^[a-zA-Z0-9_-]{3,40}$/.test(this); },
	subUrlname: function() { return "posts" != this && !/^[0-9]+$/.test(this) && /^[a-z0-9-]{4,20}$/.test(this);},
	subDescription: function() { return this.length >= 5 && this.length <= 500; },

	postTitle: function() { return this.length >= 5 && this.length <= 50; },
	postContent: function() { return this.length > 10; },
	postLink: function() { return this.length < 255 && require('is-http-url')(this); },

	commentContent: function() { return this.length > 1; }
};

const ERRTYPES = {
	MISSING: "MISSING",
	INVALID: "INVALID FIELD",
	FORMAT: "INVALID FORMAT"
};

/* Los modelos son objetos que se definen como objetos clave-valor donde las claves son el nombre del elemento contra el que se hará la comprobación posterior; y el valor es
una función de validación */
// Los modelos con formato array son para output y dfeben ser parseados la función propia toString
let userEdit = {
	email: validators.email,
	password: validators.valid,
	description: validators.description,
	avatar: validators.avatar
};
let user = Object.assign({}, userEdit);
user.name = validators.username;

let subEdit = {
	name: validators.subName,
	description: validators.subDescription
}
let sub = Object.assign({}, subEdit);
sub.urlname = validators.subUrlname;

let postEdit = {
	title: validators.postTitle,
	content: validators.postContent,
	image: validators.avatar
}
let post = Object.assign({}, postEdit);
post.link = validators.postLink;

let commentEdit = {
	content: validators.commentContent
}
let comment = Object.assign({}, commentEdit);
comment.replyTo = validators.valid;

let login = {
	user: validators.username,
	password: validators.valid
}

const models = Object.freeze({
	user,
	userEdit,

	sub,
	subEdit,

	post,
	postEdit,

	comment,
	commentEdit,

	login
});

module.exports = integrityChecker;
module.exports.validate = function(obj, which) { return validators[which].call(obj); }
module.exports.models = models;
module.exports.toString = function(model) {
	if(models[model] instanceof Array)
		return models[model].join(", ");
	else
		return Object.keys(models[model]).join(", ");
}


function integrityChecker(obj, objectType, required) {

	if(process.env.NODE_ENV !== 'production') {
		if(models[objectType] === undefined)
			throw new Error("No model named " + objectType);

		if(models[objectType] instanceof Array)
			throw new Error("Model " + objectType + " is an out-only model")

		if(required instanceof Array) {
			for(var attr of required) {
				if(models[objectType][attr] === undefined)
					throw new Error("Model " + objectType + " does not have an attribute named " + attr);
			}
		}
	}

	let ret = {
		errors: []
	}

	let requiredList;

	for(attr in obj) {
		if(!models[objectType].hasOwnProperty(attr)) {
			ret.errors.push({
				field: attr,
				type: ERRTYPES.INVALID
			})
		}
	}

	if(required === false) {
		requiredList = [];
	} else if(required instanceof Array) {
		requiredList = required;
	} else {
		requiredList = Object.keys(models[objectType]);
	}

	for(attr of requiredList) {
		if(!obj.hasOwnProperty(attr)) {
			ret.errors.push({
				field: attr,
				type: ERRTYPES.MISSING
			})
		}
	}

	if(ret.errors.length === 0) {
		for(attr in obj) {
			if(!models[objectType][attr].call(obj[attr])) {
				ret.errors.push({
					field: attr,
					type: ERRTYPES.FORMAT
				})
			}
		}
	}

	ret.result = ret.errors.length === 0;

	return ret;


}