module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'tsconfig.json',
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint/eslint-plugin'],
	extends: ['airbnb-typescript-prettier'],
	root: true,
	env: {
		node: true,
		jest: true,
	},
	rules: {
		'@typescript-eslint/interface-name-prefix': 'off',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'import/prefer-default-export': 'off',
		'prefer-destructuring': ['error', { object: true, array: false }],
		'no-useless-constructor': 'off',
		'class-methods-use-this': 'off',
		'prettier/prettier': [
			'error',

			{
				endOfLine: 'auto',
			},
		],
		'max-classes-per-file': ['error', 3],
		'import/no-cycle': 'off',
		'no-shadow': 'off',
		'no-param-reassign': 'off',
		'no-nested-ternary': 'off',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/no-empty-interface': 'off',
		'react/static-property-placement': 'off',
		'no-template-curly-in-string': 'off',
		'no-underscore-dangle': 'off',
	},
};
