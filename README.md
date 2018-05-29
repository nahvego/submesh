# submesh

Organizado un poco random

## Autenticación
La autenticación requiere de la generación de tokens de login por cada usuario.
En esta primera fase, los tokens no caducan y no hay límite ni regulación sobre ellos más allá del usuario

Para autenticar una petición el header Authentication debe tener la forma `SMB base64string` donde base64string es *userID=token* en base64

## Base de datos
Utiliza una base de datos MySQL pero debería poder modificarse para usar cualquier otra DB si los wrappers adecuados se modifican.
La app tiene un `app.connManager` que es un objeto ConnectionManager que tiene las funciones getConnection() y releaseConnection() para obtener y dejar conexiones.
El ConnectionManager también se encarga de que las conexiones dispongan de un método _.query_ que funcione como una promesa (y por tanto con async/await) y que devuelva null ante un insert sin resultados.

### Conexiones
El servidor crea una pool de conexiones y utiliza una conexión por request, _para toda la request_, después la deja.

## Roles
- Los permisos se guardan en la tabla `permissions` de la bbdd, su codename es el que se usa en el código
- Los roles tienen un nombre, color y _badge_ como decoración.
- Se asignan permisos a roles mediante una entrada en `role_permissions`

### Todos los permisos
| Permiso               |Codename        |
| :---: | :---: |
|Leer perfil completo  |get-full-profile|
|Editar usuario	       |edit-users      |
|Borrar usuario        |delete-users    |
|----------------------|----------------|
|Desactivar post       |remove-posts    |
|Borrar post           |delete-posts    |
|----------------------|----------------|
|Desactivar comentarios|remove-comments |
|Borrar comentarios    |delete-comments |
|----------------------|----------------|
|Desactivar siub       |remove-subs     |
|Borrar sub            |delete-subs     |
|Editar sub            |edit-subs       |
|Otros datos del sub?  |??              |
|Nada más?             |                |

## Request
El objeto request se modifica en varios momentos según pasa por diferentes middlewares
- [x] Al autenticarse se crea `req.user` que tiene el formato:
```
req.user = {
	id: 'id del usuario', // es una string!
	name: 'nombre del usuario',
	role: '**NOMBRE** del rol, o nulo',
	roleColor,
	roleBadge,
	permissions: [ perms ] // Array de permisos del rol.
}
```
- [x] Conexión a la conexión de la petición en `req.db`
- [x] La función `isAllowedTo(permissionCode [, user]` en `req.isAllowedTo` para comprobar acceso
- [ ] Otros datos como el sub cuando se entra en posts, etc se guardarán en la request

## Response
El objeto response también se modifica
- [x] La función `res.json` pasa a llamarse `res._json` y se establece en su lugar una función equivalente pero que devuelve la conexión automáticamente
- [x] `res.releaseDB` llama al ConnectionManager para devolver la conexión
- [x] `res._db` referencia a la conexión, privada.
- [x] `res.badPetition` para estandarizar los resultados de peticiones incorrectas [WIP] 

## Modelos
Para facilitar la comprobación de datos de los usuarios, el módulo models ofrece funciones para comprobar la corrección del input de modo que si hubiera que cambiar algún modelo, el cambio sería invisible para la app y focalizado en el módulo

### TODOs
- [ ] Posts
- [ ] Subs
- [ ] Comentarios
- [ ] Obtener tokens de usuario
- [ ] Subs privados
- [ ] Mensajería
- [ ] scopes?
- [ ] Establecer bien si se borran usuarios, no, y esas cosas.
- [ ] Moderación de subs, pero bien hecha.
- [ ] Logs de moderación per-sub

### Otras cosas random del bloc de notas

## Sobre requisitos

# Al borrarse un usuario:
- Se borra?
- Se conservan post y comentarios
- Se conservan votos

# Al borrarse un comentario:
- No se borra para conservar las respuestas: Hay algún otro modo?

---

- Hay que asegurarse de que los elementos "eliminados" pero que siguen en la base de datos no sean accesibles a través de la API
- Es diferente la desactivación que el borrado: la desactivación debe poder deshacerse, el borrado no tiene por qué


DUDAS:
- oAuth?
- En checker.js, por qué hace falta el await al llamar a auth-parser?
- Modulos: Muy verbose?
- Sobre la presentación: Muy técnica, menos técnica?
- Base de datos: Redudancia?
- Idenficación: Cómo
- Vue: Pues eso
