const { validateEntityName } = require("./entity-definition");

function createEntityNaming(entityName) {
  validateEntityName(entityName, "Entity name");

  const singularWords = splitNameWords(entityName.trim());
  const pluralWords = singularWords.slice(0, -1).concat(pluralizeWord(singularWords.at(-1)));

  return {
    entityName: joinPascalCase(singularWords),
    tableName: joinLowerCase(pluralWords, "_"),
    routeName: joinLowerCase(pluralWords, "-"),
    controllerName: `${joinPascalCase(pluralWords)}Controller`,
    pageComponentName: `${joinPascalCase(pluralWords)}Page`,
    formComponentName: `${joinPascalCase(singularWords)}Form`,
  };
}

function splitNameWords(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean)
    .map(capitalizeWord);
}

function pluralizeWord(word) {
  const lowerWord = word.toLowerCase();

  if (/[bcdfghjklmnpqrstvwxyz]y$/i.test(word)) {
    return `${word.slice(0, -1)}ies`;
  }

  if (/(s|x|z|ch|sh)$/i.test(lowerWord)) {
    return `${word}es`;
  }

  return `${word}s`;
}

function joinPascalCase(words) {
  return words.map(capitalizeWord).join("");
}

function joinLowerCase(words, separator) {
  return words.map((word) => word.toLowerCase()).join(separator);
}

function capitalizeWord(word) {
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}

module.exports = {
  createEntityNaming,
};
