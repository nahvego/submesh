module.exports = badPetition;

const codes = {
    CREATED: 201,
    OK: 200,
    INTERNAL_ERROR: 500,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    DELETED: 200,  
    MODIFIED: 200,
    NOT_IMPLEMENTED: 501,
    FORBIDDEN: 403
};

/*
Errors es un objeto cuyas claves son identificadores de posibles errores con valores de un array de 3 dimensiones que contienen:
[0]: Número identificativo interno del error.
[1]: Mensaje de error para mostrar al requester
[2]: Código HTTP a devolver
*/
const errors = {
	// TODO: Rehacer errores
    "noId": [0, "ID inexistente", codes.NOT_FOUND],
    "noSuchUser": [1, "No existe el usuario", codes.NOT_FOUND],
    "invalidID": [4, "La ID no es válida", codes.BAD_REQUEST],
    "invalidName": [5, "El nombre de usuario no es válido", codes.BAD_REQUEST],
    "invalidEmail": [6, "El email no es válido", codes.BAD_REQUEST],
    "nameExists": [7, "Nombre en uso", codes.BAD_REQUEST],
    "emailExists": [8, "EMail en uso", codes.BAD_REQUEST],
    "passwordExists": [9, "%s está usando esta contraseña", codes.BAD_REQUEST], // ES BROMA ES BROMA 
    "noSuchPost": [20, "No existe el post con esa ID", codes.BAD_REQUEST],
    "postNotOwned": [21, "Necesitas ser el autor", codes.FORBIDDEN],
    "noSuchComment": [40, "No existe el comentario con esa ID en ese post", codes.BAD_REQUEST],
    "commentNotOwned": [41, "Necesitas ser el autor", codes.FORBIDDEN],
    "incorrectParams": [102, "Parametros incorrectos", codes.BAD_REQUEST],
    "invalidJSON": [104, "JSON incorrecto", codes.BAD_REQUEST],
    "noHeaders": [101, "Headers incorrectos", codes.BAD_REQUEST],
    "invalidKey": [100, "Clave de aplicación no válida", codes.FORBIDDEN],
    "invalidUserToken": [102, "Token de usuario no válido", codes.FORBIDDEN],
    "notFound": [404, "Pagína no encontrada", codes.NOT_FOUND],
    "forbidden": [401, "Datos incorrectos", codes.FORBIDDEN],
    "-": [403, "Faltan permisos", codes.FORBIDDEN],
    "notImplemented": [501, "No implementado", codes.NOT_IMPLEMENTED],
	"genericServerError": [500, "Error de servidor", codes.INTERNAL_ERROR],
	
	"dbConnection": [550, "No se pudo conectar a la base de datos", codes.INTERNAL_ERROR],
	"malformedRequest": [400, "Petición incorrecta", codes.BAD_REQUEST],

	// Errores sobre users: 1XXX
	// Errores sobre subs: 2XXX
	"noSuchSub": [2000, "No existe el sub", codes.BAD_REQUEST],
	"invalidSubname": [2001, "Nombre de sub no válido", codes.BAD_REQUEST],
	"subExists": [2002, "El identificador URL del sub ya está en uso", codes.BAD_REQUEST],
	// Errores sobre posts: 3XXX
	"noSuchPost": [3000, "El post no existe", codes.BAD_REQUEST],
	"incorrectSubForGivenPost": [3001, "El post no corresponde al sub proporcionado", codes.BAD_REQUEST]
};

/*
Usar mediante badPetition("errorString"). El valor de THIS debe ser un objeto REQUEST.
Si se incluye un segundo parámetro se tomará la string como literal.
*/

function badPetition(errStr, additional) {
	this.releaseDB();

	if(additional !== undefined && typeof additional === "number") {
		genericError.call(this, errStr, additional)
	} else {
		let e = buildError(errStr);
		if(additional !== undefined) {
			if(typeof additional === "string")
				e.json.msg = additional;
			else
				Object.assign(e.json, additional);
		}
		this.status(e.status)._json(e.json);
	}

	return false;
}

// Error de programación
function genericError(errorString, httpCode) {
    this.status(((Number.isInteger(httpCode) && httpCode) || codes.INTERNAL_ERROR));
    this._json({error:errorString});
}

function buildError(errStr) {
    if(errors[errStr] === undefined)
        return {
            "status": 500,
            "json": {
                "errId": 1000,
                "msg": "El código de error " + errStr + " no existe."
            }
        }
    else
        return {
            "status": errors[errStr][2],
            "json": {
                "errId": errors[errStr][0],
                "msg": errors[errStr][1]
            }
        }
}