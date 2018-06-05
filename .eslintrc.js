module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
		"sourceType": "module",
		"ecmaVersion": 2017,
		"impliedStrict": true
    },
    "rules": {
        "indent": [
            "error",
            "tab"
        ],
        "linebreak-style": [
            "error",
            "windows"
		],
		/*
        "semi": [
            "error",
            "always"
		]*/
		
		"no-unused-vars": ["error", { "args": "none" }],
		"no-await-in-loop": "error",
		"no-template-curly-in-string": "warn",
		"array-callback-return": "warn",
		//"class-methods-use-this": "error",
		//"consistent-return": "error",
		"no-empty-function": "error",
		"no-eq-null": "error",
		"no-magic-numbers": ["warn", { "ignoreArrayIndexes": true, "ignore": [0,1,2,400,500,1000] }],
		"no-multi-spaces": "error",
		"no-multi-str": "error",
		"no-param-reassign": "error", // no sé
		"no-return-assign": "error",
		"no-return-await": "error",
		"no-self-compare": "error",
		"no-unmodified-loop-condition": "error",
		"no-unused-expressions": "warn",
		"no-useless-call": "warn",
		"no-useless-concat": "error",
		"no-void": "error",
		"no-warning-comments": "warn",
		"require-await": "warn",
		"strict": "error",
		"no-shadow": "warn",
		"no-shadow-restricted-names": "error",
		"no-use-before-define": ["error", "nofunc"],
		"callback-return": "error",
		"global-require": "warn",
		"handle-callback-err": "warn",
		"no-buffer-constructor": "error"

    }
};